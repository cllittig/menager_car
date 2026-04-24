import { Injectable } from '@nestjs/common';
import { DbTable } from '../../../database/db-tables';
import { ensureNoError } from '../../../supabase/supabase-error.util';
import { SupabaseService } from '../../../supabase/supabase.service';
import { ClientRepository } from '../../domain/repositories/client.repository';

@Injectable()
export class SupabaseClientRepository extends ClientRepository {
  constructor(private readonly supabase: SupabaseService) {
    super();
  }

  private sb() {
    return this.supabase.getClient();
  }

  async findByCpf(tenantId: string, cpf: string): Promise<{ id: string } | null> {
    const r = await this.sb()
      .from(DbTable.Client)
      .select('id')
      .eq('cpf', cpf)
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .maybeSingle();
    return (r.data as { id: string }) ?? null;
  }

  async findByEmail(tenantId: string, email: string): Promise<{ id: string } | null> {
    const r = await this.sb()
      .from(DbTable.Client)
      .select('id')
      .eq('email', email)
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .maybeSingle();
    return (r.data as { id: string }) ?? null;
  }

  async insertClient(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const ins = await this.sb().from(DbTable.Client).insert(payload).select('*').single();
    ensureNoError(ins.error, ins.data, 'Client.create');
    return ins.data as Record<string, unknown>;
  }

  async listWithTransactions(tenantId: string): Promise<Record<string, unknown>[]> {
    const res = await this.sb()
      .from(DbTable.Client)
      .select(
        `*,
        Transaction (
          id,
          amount,
          createdAt,
          Vehicle ( brand, model, year, licensePlate )
        )`,
      )
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .order('createdAt', { ascending: false });
    ensureNoError(res.error, res.data, 'Client.findAll');
    return (res.data ?? []) as Record<string, unknown>[];
  }

  async findOneWithRelations(id: string, tenantId: string): Promise<Record<string, unknown> | null> {
    const res = await this.sb()
      .from(DbTable.Client)
      .select(
        `*,
        Transaction (
          *,
          Vehicle (*),
          Contract (*)
        )`,
      )
      .eq('id', id)
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .maybeSingle();
    if (res.error || !res.data) {
      return null;
    }
    return res.data as Record<string, unknown>;
  }

  async findByCpfExcludingId(
    tenantId: string,
    cpf: string,
    excludeId: string,
  ): Promise<{ id: string } | null> {
    const r = await this.sb()
      .from(DbTable.Client)
      .select('id')
      .eq('cpf', cpf)
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .neq('id', excludeId)
      .maybeSingle();
    return (r.data as { id: string }) ?? null;
  }

  async findByEmailExcludingId(
    tenantId: string,
    email: string,
    excludeId: string,
  ): Promise<{ id: string } | null> {
    const r = await this.sb()
      .from(DbTable.Client)
      .select('id')
      .eq('email', email)
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .neq('id', excludeId)
      .maybeSingle();
    return (r.data as { id: string }) ?? null;
  }

  async updateClient(id: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
    const upd = await this.sb().from(DbTable.Client).update(patch).eq('id', id).select('*').single();
    ensureNoError(upd.error, upd.data, 'Client.update');
    return upd.data as Record<string, unknown>;
  }

  async listIdsAndCreatedAt(tenantId: string): Promise<{ id: string; createdAt: string }[]> {
    const allRes = await this.sb()
      .from(DbTable.Client)
      .select('id, createdAt')
      .eq('tenantId', tenantId)
      .is('deletedAt', null);
    ensureNoError(allRes.error, allRes.data, 'Client.stats');
    return (allRes.data ?? []) as { id: string; createdAt: string }[];
  }

  async listWithTransactionAmounts(tenantId: string): Promise<Record<string, unknown>[]> {
    const withTx = await this.sb()
      .from(DbTable.Client)
      .select(
        `*,
        Transaction ( amount )
      `,
      )
      .eq('tenantId', tenantId)
      .is('deletedAt', null);
    ensureNoError(withTx.error, withTx.data, 'Client.statsTx');
    return (withTx.data ?? []) as Record<string, unknown>[];
  }
}
