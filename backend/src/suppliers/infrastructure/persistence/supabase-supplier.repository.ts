import { Injectable } from '@nestjs/common';
import { DbTable } from '../../../database/db-tables';
import { ensureNoError } from '../../../supabase/supabase-error.util';
import { SupabaseService } from '../../../supabase/supabase.service';
import { SupplierRepository } from '../../domain/repositories/supplier.repository';

@Injectable()
export class SupabaseSupplierRepository extends SupplierRepository {
  constructor(private readonly supabase: SupabaseService) {
    super();
  }

  private sb() {
    return this.supabase.getClient();
  }

  async insert(row: Record<string, unknown>): Promise<unknown> {
    const ins = await this.sb().from(DbTable.Supplier).insert(row).select('*').single();
    ensureNoError(ins.error, ins.data, 'Supplier.create');
    return ins.data;
  }

  async listAll(tenantId: string): Promise<unknown[]> {
    const res = await this.sb()
      .from(DbTable.Supplier)
      .select('*')
      .eq('tenantId', tenantId)
      .order('name', { ascending: true });
    ensureNoError(res.error, res.data, 'Supplier.findAll');
    return (res.data ?? []) as unknown[];
  }

  async findById(id: string, tenantId: string): Promise<unknown> {
    const res = await this.sb()
      .from(DbTable.Supplier)
      .select('*')
      .eq('id', id)
      .eq('tenantId', tenantId)
      .maybeSingle();
    if (res.error || !res.data) {
      return null;
    }
    return res.data;
  }

  async update(
    id: string,
    tenantId: string,
    patch: Record<string, unknown>,
  ): Promise<unknown> {
    const res = await this.sb()
      .from(DbTable.Supplier)
      .update(patch)
      .eq('id', id)
      .eq('tenantId', tenantId)
      .select('*')
      .maybeSingle();
    ensureNoError(res.error, res.data, 'Supplier.update');
    return res.data;
  }

  async delete(id: string, tenantId: string): Promise<{ id?: string }> {
    const del = await this.sb()
      .from(DbTable.Supplier)
      .delete()
      .eq('id', id)
      .eq('tenantId', tenantId)
      .select('id')
      .maybeSingle();
    ensureNoError(del.error, del.data, 'Supplier.delete');
    return { id: del.data?.id as string | undefined };
  }
}
