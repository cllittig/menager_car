import { Injectable } from '@nestjs/common';
import { DbTable } from '../../../database/db-tables';
import { ensureNoError } from '../../../supabase/supabase-error.util';
import { SupabaseService } from '../../../supabase/supabase.service';
import { ContractRepository } from '../../domain/repositories/contract.repository';

@Injectable()
export class SupabaseContractRepository extends ContractRepository {
  constructor(private readonly supabase: SupabaseService) {
    super();
  }

  private sb() {
    return this.supabase.getClient();
  }

  async getTransactionBasics(
    transactionId: string,
  ): Promise<{ id: string; tenantId: string } | null> {
    const txRes = await this.sb()
      .from(DbTable.Transaction)
      .select('id, tenantId')
      .eq('id', transactionId)
      .maybeSingle();
    return (txRes.data as { id: string; tenantId: string }) ?? null;
  }

  async existsForTransaction(transactionId: string): Promise<boolean> {
    const conCheck = await this.sb()
      .from(DbTable.Contract)
      .select('id')
      .eq('transactionId', transactionId)
      .maybeSingle();
    return Boolean(conCheck.data);
  }

  async insertContract(row: Record<string, unknown>): Promise<Record<string, unknown>> {
    const ins = await this.sb()
      .from(DbTable.Contract)
      .insert(row)
      .select(
        `*,
        Transaction (
          *,
          Client ( name, email, cpf ),
          Vehicle ( brand, model, year, licensePlate )
        )
      `,
      )
      .single();
    ensureNoError(ins.error, ins.data, 'Contract.create');
    return ins.data as Record<string, unknown>;
  }

  async getTransactionForUpload(transactionId: string): Promise<{
    id: string;
    tenantId: string;
    Vehicle: { licensePlate: string } | null;
  } | null> {
    const txRes = await this.sb()
      .from(DbTable.Transaction)
      .select('id, tenantId, Vehicle ( licensePlate )')
      .eq('id', transactionId)
      .maybeSingle();
    return (txRes.data as unknown as {
      id: string;
      tenantId: string;
      Vehicle: { licensePlate: string } | null;
    }) ?? null;
  }

  async listIdsByFileNamePrefix(tenantId: string, prefix: string): Promise<unknown[]> {
    const dupCheck = await this.sb()
      .from(DbTable.Contract)
      .select('id')
      .eq('tenantId', tenantId)
      .like('fileName', `${prefix}%`);
    ensureNoError(dupCheck.error, dupCheck.data, 'Contract.dupCheck');
    return dupCheck.data ?? [];
  }

  async listAllForTenantRaw(tenantId: string): Promise<unknown[]> {
    const res = await this.sb()
      .from(DbTable.Contract)
      .select(
        `id, fileName, mimeType, fileSize, fileHash, uploadDate, createdAt, updatedAt, transactionId,
        Transaction (
          id, type, amount, status, createdAt,
          Client ( name, email, phone, cpf ),
          Vehicle ( brand, model, year, licensePlate )
        )
      `,
      )
      .eq('tenantId', tenantId)
      .order('createdAt', { ascending: false });
    ensureNoError(res.error, res.data, 'Contract.findAll');
    return res.data ?? [];
  }

  async findOneJoined(id: string, tenantId: string): Promise<Record<string, unknown> | null> {
    const res = await this.sb()
      .from(DbTable.Contract)
      .select(
        `*,
        Transaction (
          *,
          Client (*),
          Vehicle (*)
        )
      `,
      )
      .eq('id', id)
      .eq('tenantId', tenantId)
      .maybeSingle();
    if (res.error || !res.data) {
      return null;
    }
    return res.data as Record<string, unknown>;
  }

  async updateFileMeta(
    id: string,
    tenantId: string,
    fileName: string,
    updatedAt: string,
  ): Promise<unknown> {
    const res = await this.sb()
      .from(DbTable.Contract)
      .update({ fileName, updatedAt })
      .eq('id', id)
      .eq('tenantId', tenantId)
      .select('id, fileName, mimeType, fileSize, uploadDate, updatedAt, transactionId')
      .maybeSingle();
    ensureNoError(res.error, res.data, 'Contract.update');
    return res.data;
  }

  async deleteReturning(id: string): Promise<unknown> {
    const del = await this.sb().from(DbTable.Contract).delete().eq('id', id).select('*').single();
    ensureNoError(del.error, del.data, 'Contract.delete');
    return del.data;
  }

  async listActiveTransactionIds(tenantId: string): Promise<string[]> {
    const txRes = await this.sb()
      .from(DbTable.Transaction)
      .select('id')
      .eq('tenantId', tenantId)
      .eq('isActive', true);
    ensureNoError(txRes.error, txRes.data, 'Transaction.ids');
    return (txRes.data ?? []).map((t: { id: string }) => t.id);
  }

  async listContractTransactionIds(tenantId: string): Promise<string[]> {
    const conRes = await this.sb()
      .from(DbTable.Contract)
      .select('transactionId')
      .eq('tenantId', tenantId);
    ensureNoError(conRes.error, conRes.data, 'Contract.txIds');
    return (conRes.data ?? []).map((c: { transactionId: string }) => c.transactionId);
  }

  async listTransactionsWithRelations(ids: string[]): Promise<unknown[]> {
    const res = await this.sb()
      .from(DbTable.Transaction)
      .select(
        `*,
        Client ( name, email, cpf ),
        Vehicle ( brand, model, year, licensePlate )
      `,
      )
      .in('id', ids)
      .order('createdAt', { ascending: false });
    ensureNoError(res.error, res.data, 'Transaction.available');
    return (res.data ?? []) as unknown[];
  }

  async countByTenant(tenantId: string): Promise<number> {
    const totalRes = await this.sb()
      .from(DbTable.Contract)
      .select('id', { count: 'exact', head: true })
      .eq('tenantId', tenantId);
    return totalRes.count ?? 0;
  }

  async countByTenantSince(tenantId: string, sinceIso: string): Promise<number> {
    const monthRes = await this.sb()
      .from(DbTable.Contract)
      .select('id', { count: 'exact', head: true })
      .eq('tenantId', tenantId)
      .gte('createdAt', sinceIso);
    return monthRes.count ?? 0;
  }

  async listWithNestedTransactionType(tenantId: string): Promise<unknown[]> {
    const withType = await this.sb()
      .from(DbTable.Contract)
      .select(
        `id,
        Transaction ( type )
      `,
      )
      .eq('tenantId', tenantId);
    ensureNoError(withType.error, withType.data, 'Contract.byType');
    return withType.data ?? [];
  }

  async findByTransactionJoined(
    transactionId: string,
    tenantId: string,
  ): Promise<Record<string, unknown> | null> {
    const res = await this.sb()
      .from(DbTable.Contract)
      .select(
        `*,
        Transaction (
          *,
          Client ( name, email, cpf ),
          Vehicle ( brand, model, year, licensePlate )
        )
      `,
      )
      .eq('transactionId', transactionId)
      .eq('tenantId', tenantId)
      .maybeSingle();
    if (!res.data) {
      return null;
    }
    return res.data as Record<string, unknown>;
  }
}
