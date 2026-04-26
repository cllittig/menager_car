import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TenantResolutionService } from '../../core/application/tenant-resolution.service';
import { PaymentStatus, TransactionType } from '../../database/domain.enums';
import { SaleRepository } from '../domain/repositories/sale.repository';
import { CreateSaleDto } from '../dto/create-sale.dto';

@Injectable()
export class SalesApplicationService {
  constructor(
    private readonly tenantResolution: TenantResolutionService,
    private readonly saleRepository: SaleRepository,
  ) {}

  private normalizeSaleRow(row: Record<string, unknown>) {
    const { Vehicle: veh, Client: cli, Installment: inst, Contract: con, ...rest } = row;
    let contractVal: unknown = con;
    if (Array.isArray(con)) {
      contractVal = con.length <= 1 ? con[0] ?? null : con;
    }
    const installments = Array.isArray(inst) ? inst : inst ? [inst] : [];
    return {
      ...rest,
      vehicle: veh,
      client: cli,
      installments: installments,
      contract: contractVal,
    };
  }

  async create(createSaleDto: CreateSaleDto, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);

    const vehicle = await this.saleRepository.findVehicleForSale(
      createSaleDto.vehicleId,
      tenantId,
    );
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado ou não pertence ao usuário');
    }
    if (vehicle.status !== 'AVAILABLE') {
      throw new ConflictException('Veículo não está disponível para venda');
    }

    const clientOk = await this.saleRepository.clientExistsInTenant(
      createSaleDto.clientId,
      tenantId,
    );
    if (!clientOk) {
      throw new NotFoundException('Cliente não encontrado ou não pertence ao usuário');
    }

    if (createSaleDto.installments && createSaleDto.installments.length > 0) {
      const totalInstallments = createSaleDto.installments.reduce((sum, inst) => sum + inst.amount, 0);
      if (Math.abs(totalInstallments - createSaleDto.amount) > 0.01) {
        throw new BadRequestException('A soma das parcelas deve ser igual ao valor total da venda');
      }
    }

    const txId = randomUUID();
    const now = new Date().toISOString();
    const hasInstallments = (createSaleDto.installments?.length ?? 0) > 0;
    const txInsert = {
      id: txId,
      vehicleId: createSaleDto.vehicleId,
      clientId: createSaleDto.clientId,
      type: TransactionType.SALE,
      amount: createSaleDto.amount,
      tenantId,
      status:
        createSaleDto.status ??
        (hasInstallments ? PaymentStatus.PENDING : PaymentStatus.PAID),
      createdBy: userId,
      updatedAt: now,
    };

    await this.saleRepository.insertTransaction(txInsert);

    try {
      if (createSaleDto.installments && createSaleDto.installments.length > 0) {
        const rows = createSaleDto.installments.map((inst) => ({
          id: randomUUID(),
          transactionId: txId,
          number: inst.number,
          amount: inst.amount,
          dueDate: new Date(inst.dueDate).toISOString(),
          status: PaymentStatus.PENDING,
          updatedAt: now,
        }));
        try {
          await this.saleRepository.insertInstallments(rows);
        } catch (err) {
          await this.saleRepository.deleteTransaction(txId);
          throw err;
        }
      }

      try {
        await this.saleRepository.updateVehicleAfterSale(createSaleDto.vehicleId, {
          status: 'SOLD',
          saleDate: (createSaleDto.saleDate ? new Date(createSaleDto.saleDate) : new Date()).toISOString(),
          salePrice: createSaleDto.amount,
          updatedBy: userId,
          updatedAt: now,
        });
      } catch (err) {
        await this.saleRepository.deleteInstallmentsByTransaction(txId);
        await this.saleRepository.deleteTransaction(txId);
        throw err;
      }
    } catch (e) {
      await this.saleRepository.deleteInstallmentsByTransaction(txId);
      await this.saleRepository.deleteTransaction(txId);
      throw e;
    }

    const full = await this.saleRepository.fetchTransactionFull(txId);
    return this.normalizeSaleRow(full);
  }

  async findAll(userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const vids = await this.saleRepository.listVehicleIdsByTenant(tenantId);
    if (vids.length === 0) {
      return [];
    }

    const res = await this.saleRepository.listSaleTransactionsForVehicles(vids);
    return (res as Record<string, unknown>[]).map((r) => this.normalizeSaleRow(r));
  }

  async findOne(id: string, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const vids = await this.saleRepository.listVehicleIdsByTenant(tenantId);

    const res = await this.saleRepository.findTransactionSaleById(id);

    if (!res) {
      throw new NotFoundException('Venda não encontrada ou não pertence ao usuário');
    }
    const row = res as { vehicleId: string };
    if (!vids.includes(row.vehicleId)) {
      throw new NotFoundException('Venda não encontrada ou não pertence ao usuário');
    }

    return this.normalizeSaleRow(res);
  }

  async updatePaymentStatus(
    id: string,
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED',
    userId: string,
  ) {
    await this.findOne(id, userId);
    const upd = await this.saleRepository.updateTransactionRecord(id, {
      status: status as PaymentStatus,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    });
    return this.normalizeSaleRow(upd);
  }

  async payInstallment(saleId: string, installmentNumber: number, userId: string) {
    await this.findOne(saleId, userId);

    const installment = await this.saleRepository.findInstallmentByTxAndNumber(
      saleId,
      installmentNumber,
    );
    if (!installment) {
      throw new NotFoundException('Parcela não encontrada');
    }
    if (installment.status === 'PAID') {
      throw new ConflictException('Parcela já foi paga');
    }

    const paidAt = new Date().toISOString();
    const data = await this.saleRepository.updateInstallmentPaid(installment.id, paidAt);

    const statuses = await this.saleRepository.listInstallmentStatuses(saleId);
    const allPaid = statuses.every((i) => i.status === 'PAID');
    if (allPaid) {
      await this.saleRepository.markTransactionPaid(saleId, userId);
    }

    return data;
  }

  async getSalesStats(userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const vids = await this.saleRepository.listVehicleIdsByTenant(tenantId);
    if (vids.length === 0) {
      return {
        totalSales: 0,
        salesThisMonth: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        salesByStatus: [],
        topVehicles: [],
      };
    }

    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const sales = await this.saleRepository.listTransactionsForStats(vids);

    const salesThisMonth = sales.filter(
      (s) =>
        new Date(s.createdAt) >= firstDayOfMonth && new Date(s.createdAt) <= lastDayOfMonth,
    );
    const totalSales = sales.length;
    const totalRevenue = sales
      .filter((s) => s.status === 'PAID')
      .reduce((sum, s) => sum + s.amount, 0);
    const monthlyRevenue = salesThisMonth
      .filter((s) => s.status === 'PAID')
      .reduce((sum, s) => sum + s.amount, 0);

    const byStatusMap = new Map<string, { _count: { id: number }; _sum: { amount: number } }>();
    for (const s of sales) {
      const cur = byStatusMap.get(s.status) ?? { _count: { id: 0 }, _sum: { amount: 0 } };
      cur._count.id += 1;
      cur._sum.amount += s.amount;
      byStatusMap.set(s.status, cur);
    }
    const salesByStatus = [...byStatusMap.entries()].map(([status, v]) => ({
      status,
      _count: v._count,
      _sum: v._sum,
    }));

    const topSorted = [...sales].sort((a, b) => b.amount - a.amount).slice(0, 10);
    const vehRows = await this.saleRepository.listVehiclesBrief(topSorted.map((s) => s.vehicleId));
    const vehMap = new Map<string, { brand: string; model: string; year: number }>();
    for (const r of vehRows) {
      vehMap.set(r.id, { brand: r.brand, model: r.model, year: r.year });
    }
    const topVehicles = topSorted.map((sale) => ({
      vehicle: vehMap.get(sale.vehicleId),
      amount: sale.amount,
      date: sale.createdAt,
    }));

    return {
      totalSales,
      salesThisMonth: salesThisMonth.length,
      totalRevenue,
      monthlyRevenue,
      salesByStatus,
      topVehicles,
    };
  }

  async getPendingPayments(userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const vids = await this.saleRepository.listVehicleIdsByTenant(tenantId);
    if (vids.length === 0) {
      return [];
    }
    const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const rows = await this.saleRepository.listPendingInstallmentsDueBefore(until);
    return rows
      .filter(
        (r) =>
          r.Transaction?.type === TransactionType.SALE && vids.includes(r.Transaction.vehicleId),
      )
      .map((r) => ({
        ...r,
        transaction: r.Transaction,
      }))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }

  async delete(id: string, userId: string) {
    const sale = (await this.findOne(id, userId)) as unknown as { vehicleId: string };

    const delTx = await this.saleRepository.softDeactivateTransaction(id, userId);

    await this.saleRepository.revertVehicleSaleState(sale.vehicleId, userId);

    return {
      message: 'Venda excluída com sucesso',
      id: delTx.id,
    };
  }

  async update(id: string, updateData: Partial<CreateSaleDto>, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    await this.findOne(id, userId);

    if (updateData.vehicleId) {
      const v = await this.saleRepository.vehicleExistsInTenant(updateData.vehicleId, tenantId);
      if (!v) {
        throw new NotFoundException('Veículo não encontrado ou não pertence ao usuário');
      }
    }
    if (updateData.clientId) {
      const c = await this.saleRepository.clientExistsInTenant(updateData.clientId, tenantId);
      if (!c) {
        throw new NotFoundException('Cliente não encontrado ou não pertence ao usuário');
      }
    }

    const patch: Record<string, unknown> = {
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };
    if (updateData.vehicleId) {
      patch.vehicleId = updateData.vehicleId;
    }
    if (updateData.clientId) {
      patch.clientId = updateData.clientId;
    }
    if (updateData.amount !== undefined) {
      patch.amount = updateData.amount;
    }

    const upd = await this.saleRepository.updateTransactionSaleFields(id, patch);
    return this.normalizeSaleRow(upd);
  }
}
