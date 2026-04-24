import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TenantResolutionService } from '../../core/application/tenant-resolution.service';
import { CreateClientDto } from '../dto/create-client.dto';
import { UpdateClientDto } from '../dto/update-client.dto';
import { ClientRepository } from '../domain/repositories/client.repository';

@Injectable()
export class ClientsApplicationService {
  constructor(
    private readonly tenantResolution: TenantResolutionService,
    private readonly clientRepository: ClientRepository,
  ) {}

  async create(createClientDto: CreateClientDto, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);

    if (await this.clientRepository.findByCpf(tenantId, createClientDto.cpf)) {
      throw new ConflictException('CPF já cadastrado no sistema');
    }

    if (await this.clientRepository.findByEmail(tenantId, createClientDto.email)) {
      throw new ConflictException('E-mail já cadastrado no sistema');
    }

    const { birthDate, ...restDto } = createClientDto;
    const now = new Date().toISOString();
    return this.clientRepository.insertClient({
      id: randomUUID(),
      ...restDto,
      birthDate: birthDate?.toISOString() ?? null,
      userId,
      tenantId,
      updatedAt: now,
    });
  }

  async findAll(userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const rows = await this.clientRepository.listWithTransactions(tenantId);
    return rows.map((row: Record<string, unknown>) => {
      const { Transaction: txList, ...rest } = row;
      const txs = (txList ?? []) as unknown[];
      return {
        ...rest,
        transactions: txs,
        _count: { transactions: txs.length },
      };
    });
  }

  async findOne(id: string, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const row = await this.clientRepository.findOneWithRelations(id, tenantId);
    if (!row) {
      throw new NotFoundException('Cliente não encontrado');
    }
    const { Transaction: txList, ...rest } = row;
    const txs = txList ?? [];
    return { ...rest, transactions: txs };
  }

  async update(id: string, userId: string, updateClientDto: UpdateClientDto) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    await this.findOne(id, userId);

    if (updateClientDto.cpf) {
      if (await this.clientRepository.findByCpfExcludingId(tenantId, updateClientDto.cpf, id)) {
        throw new ConflictException('CPF já cadastrado para outro cliente');
      }
    }

    if (updateClientDto.email) {
      if (await this.clientRepository.findByEmailExcludingId(tenantId, updateClientDto.email, id)) {
        throw new ConflictException('E-mail já cadastrado para outro cliente');
      }
    }

    return this.clientRepository.updateClient(id, {
      ...updateClientDto,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.clientRepository.updateClient(id, {
      deletedAt: new Date().toISOString(),
      deletedBy: userId,
      isActive: false,
      updatedAt: new Date().toISOString(),
    });
  }

  async getClientStats(userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const all = await this.clientRepository.listIdsAndCreatedAt(tenantId);
    const totalClients = all.length;
    const clientsThisMonth = all.filter((c) => c.createdAt >= startMonth).length;

    const withTxRows = await this.clientRepository.listWithTransactionAmounts(tenantId);

    const enriched = withTxRows.map((row: Record<string, unknown>) => {
      const { Transaction: txList, ...rest } = row;
      const txs = (txList ?? []) as { amount: number }[];
      return {
        ...rest,
        transactions: txs,
        _count: { transactions: txs.length },
      };
    });

    enriched.sort((a, b) => b._count.transactions - a._count.transactions);
    const topClients = enriched.slice(0, 5).map((client) => ({
      ...client,
      totalPurchases: (client.transactions as { amount: number }[]).reduce((s, t) => s + t.amount, 0),
    }));

    return {
      totalClients,
      clientsThisMonth,
      topClients,
    };
  }
}
