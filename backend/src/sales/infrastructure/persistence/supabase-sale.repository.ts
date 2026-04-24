import { Injectable } from '@nestjs/common';
import { DbTable } from '../../../database/db-tables';
import { PaymentStatus, TransactionType } from '../../../database/domain.enums';
import { ensureNoError } from '../../../supabase/supabase-error.util';
import { SupabaseService } from '../../../supabase/supabase.service';
import { SaleRepository } from '../../domain/repositories/sale.repository';

@Injectable()
export class SupabaseSaleRepository extends SaleRepository {
  constructor(private readonly supabase: SupabaseService) {
    super();
  }

  private sb() {
    return this.supabase.getClient();
  }

  async listVehicleIdsByTenant(tenantId: string): Promise<string[]> {
    const v = await this.sb()
      .from(DbTable.Vehicle)
      .select('id')
      .eq('tenantId', tenantId)
      .is('deletedAt', null);
    ensureNoError(v.error, v.data, 'Vehicle.ids');
    return (v.data ?? []).map((r: { id: string }) => r.id);
  }

  async findVehicleForSale(
    vehicleId: string,
    tenantId: string,
  ): Promise<{ status: string } | null> {
    const vehicleRes = await this.sb()
      .from(DbTable.Vehicle)
      .select('*')
      .eq('id', vehicleId)
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .maybeSingle();
    return (vehicleRes.data as { status: string }) ?? null;
  }

  async clientExistsInTenant(clientId: string, tenantId: string): Promise<boolean> {
    const clientRes = await this.sb()
      .from(DbTable.Client)
      .select('id')
      .eq('id', clientId)
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .maybeSingle();
    return Boolean(clientRes.data);
  }

  async insertTransaction(row: Record<string, unknown>): Promise<void> {
    const insTx = await this.sb().from(DbTable.Transaction).insert(row).select('*').single();
    if (insTx.error) {
      ensureNoError(insTx.error, insTx.data, 'Transaction.create');
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.sb().from(DbTable.Transaction).delete().eq('id', id);
  }

  async insertInstallments(rows: Record<string, unknown>[]): Promise<void> {
    const insInst = await this.sb().from(DbTable.Installment).insert(rows);
    if (insInst.error) {
      ensureNoError(insInst.error, insInst.data, 'Installment.create');
    }
  }

  async deleteInstallmentsByTransaction(transactionId: string): Promise<void> {
    await this.sb().from(DbTable.Installment).delete().eq('transactionId', transactionId);
  }

  async updateVehicleAfterSale(vehicleId: string, patch: Record<string, unknown>): Promise<void> {
    const updV = await this.sb().from(DbTable.Vehicle).update(patch).eq('id', vehicleId);
    if (updV.error) {
      ensureNoError(updV.error, updV.data, 'Vehicle.updateSale');
    }
  }

  async fetchTransactionFull(transactionId: string): Promise<Record<string, unknown>> {
    const full = await this.sb()
      .from(DbTable.Transaction)
      .select(
        `*,
        Vehicle (*),
        Client (*),
        Installment (*)
      `,
      )
      .eq('id', transactionId)
      .single();
    ensureNoError(full.error, full.data, 'Transaction.fetchCreated');
    return full.data as Record<string, unknown>;
  }

  async listSaleTransactionsForVehicles(vehicleIds: string[]): Promise<unknown[]> {
    const res = await this.sb()
      .from(DbTable.Transaction)
      .select(
        `*,
        Vehicle ( brand, model, year, licensePlate, color, saleDate ),
        Client ( name, email, phone, cpf ),
        Installment (*),
        Contract ( id, fileName, uploadDate )
      `,
      )
      .eq('type', TransactionType.SALE)
      .eq('isActive', true)
      .in('vehicleId', vehicleIds)
      .order('createdAt', { ascending: false });
    ensureNoError(res.error, res.data, 'Transaction.findAllSales');
    return (res.data ?? []) as unknown[];
  }

  async findTransactionSaleById(transactionId: string): Promise<Record<string, unknown> | null> {
    const res = await this.sb()
      .from(DbTable.Transaction)
      .select(
        `*,
        Vehicle (*),
        Client (*),
        Installment (*),
        Contract (*)
      `,
      )
      .eq('id', transactionId)
      .eq('type', TransactionType.SALE)
      .maybeSingle();
    if (res.error || !res.data) {
      return null;
    }
    return res.data as Record<string, unknown>;
  }

  async updateTransactionRecord(
    id: string,
    patch: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const upd = await this.sb()
      .from(DbTable.Transaction)
      .update(patch)
      .eq('id', id)
      .select(
        `*,
        Vehicle (*),
        Client (*),
        Installment (*)
      `,
      )
      .single();
    ensureNoError(upd.error, upd.data, 'Transaction.updateStatus');
    return upd.data as Record<string, unknown>;
  }

  async updateTransactionSaleFields(
    id: string,
    patch: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const upd = await this.sb()
      .from(DbTable.Transaction)
      .update(patch)
      .eq('id', id)
      .select(
        `*,
        Vehicle ( brand, model, year, licensePlate, color ),
        Client ( name, email, phone, cpf ),
        Installment (*)
      `,
      )
      .single();
    ensureNoError(upd.error, upd.data, 'Transaction.update');
    return upd.data as Record<string, unknown>;
  }

  async findInstallmentByTxAndNumber(
    transactionId: string,
    number: number,
  ): Promise<{ id: string; status: string } | null> {
    const instRes = await this.sb()
      .from(DbTable.Installment)
      .select('*')
      .eq('transactionId', transactionId)
      .eq('number', number)
      .maybeSingle();
    return (instRes.data as { id: string; status: string }) ?? null;
  }

  async updateInstallmentPaid(installmentId: string, paidAt: string): Promise<unknown> {
    const updInst = await this.sb()
      .from(DbTable.Installment)
      .update({
        status: PaymentStatus.PAID,
        paidAt,
        updatedAt: paidAt,
      })
      .eq('id', installmentId)
      .select('*')
      .single();
    ensureNoError(updInst.error, updInst.data, 'Installment.pay');
    return updInst.data;
  }

  async listInstallmentStatuses(transactionId: string): Promise<Array<{ status: string }>> {
    const all = await this.sb()
      .from(DbTable.Installment)
      .select('status')
      .eq('transactionId', transactionId);
    ensureNoError(all.error, all.data, 'Installment.list');
    return (all.data ?? []) as Array<{ status: string }>;
  }

  async markTransactionPaid(id: string, userId: string): Promise<void> {
    await this.sb()
      .from(DbTable.Transaction)
      .update({
        status: PaymentStatus.PAID,
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async listTransactionsForStats(vehicleIds: string[]): Promise<
    Array<{
      id: string;
      amount: number;
      status: string;
      createdAt: string;
      vehicleId: string;
    }>
  > {
    const base = await this.sb()
      .from(DbTable.Transaction)
      .select('*')
      .eq('type', TransactionType.SALE)
      .eq('isActive', true)
      .in('vehicleId', vehicleIds);
    ensureNoError(base.error, base.data, 'Transaction.statsBase');
    return (base.data ?? []) as Array<{
      id: string;
      amount: number;
      status: string;
      createdAt: string;
      vehicleId: string;
    }>;
  }

  async listVehiclesBrief(
    ids: string[],
  ): Promise<Array<{ id: string; brand: string; model: string; year: number }>> {
    const uniq = [...new Set(ids)];
    if (uniq.length === 0) {
      return [];
    }
    const res = await this.sb()
      .from(DbTable.Vehicle)
      .select('id, brand, model, year')
      .in('id', uniq);
    ensureNoError(res.error, res.data, 'Vehicle.map');
    return (res.data ?? []) as Array<{ id: string; brand: string; model: string; year: number }>;
  }

  async listPendingInstallmentsDueBefore(untilIso: string): Promise<
    Array<{
      dueDate: string;
      Transaction: {
        type: TransactionType;
        vehicleId: string;
        Client: unknown;
        Vehicle: unknown;
      };
    }>
  > {
    const instRes = await this.sb()
      .from(DbTable.Installment)
      .select(
        `*,
        Transaction (
          type,
          vehicleId,
          Client ( name, phone, email ),
          Vehicle ( brand, model, licensePlate )
        )
      `,
      )
      .eq('status', PaymentStatus.PENDING)
      .lte('dueDate', untilIso);
    ensureNoError(instRes.error, instRes.data, 'Installment.pending');
    return (instRes.data ?? []).map(
      (row: {
        dueDate: string;
        Transaction: {
          type: string;
          vehicleId: string;
          Client: unknown;
          Vehicle: unknown;
        };
      }) => ({
        dueDate: row.dueDate,
        Transaction: {
          ...row.Transaction,
          type: row.Transaction.type as TransactionType,
        },
      }),
    );
  }

  async softDeactivateTransaction(id: string, userId: string): Promise<{ id: string }> {
    const delTx = await this.sb()
      .from(DbTable.Transaction)
      .update({
        isActive: false,
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id')
      .single();
    ensureNoError(delTx.error, delTx.data, 'Transaction.softDelete');
    return delTx.data as { id: string };
  }

  async revertVehicleSaleState(vehicleId: string, userId: string): Promise<void> {
    await this.sb()
      .from(DbTable.Vehicle)
      .update({
        status: 'AVAILABLE',
        saleDate: null,
        salePrice: null,
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', vehicleId);
  }

  async vehicleExistsInTenant(vehicleId: string, tenantId: string): Promise<boolean> {
    const v = await this.sb()
      .from(DbTable.Vehicle)
      .select('id')
      .eq('id', vehicleId)
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .maybeSingle();
    return Boolean(v.data);
  }
}
