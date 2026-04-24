import { Injectable } from '@nestjs/common';
import { DbTable } from '../../../database/db-tables';
import { ensureNoError } from '../../../supabase/supabase-error.util';
import { SupabaseService } from '../../../supabase/supabase.service';
import { CategoryRepository } from '../../domain/repositories/category.repository';

@Injectable()
export class SupabaseCategoryRepository extends CategoryRepository {
  constructor(private readonly supabase: SupabaseService) {
    super();
  }

  private sb() {
    return this.supabase.getClient();
  }

  async findByName(
    tenantId: string,
    name: string,
    excludeId?: string,
  ): Promise<{ id: string } | null> {
    let q = this.sb()
      .from(DbTable.Category)
      .select('id')
      .eq('tenantId', tenantId)
      .eq('name', name);
    if (excludeId) {
      q = q.neq('id', excludeId);
    }
    const res = await q.maybeSingle();
    return (res.data as { id: string }) ?? null;
  }

  async insert(row: Record<string, unknown>): Promise<unknown> {
    const ins = await this.sb().from(DbTable.Category).insert(row).select('*').single();
    ensureNoError(ins.error, ins.data, 'Category.create');
    return ins.data;
  }

  async listAll(tenantId: string): Promise<unknown[]> {
    const res = await this.sb()
      .from(DbTable.Category)
      .select('*')
      .eq('tenantId', tenantId)
      .order('name', { ascending: true });
    ensureNoError(res.error, res.data, 'Category.findAll');
    return (res.data ?? []) as unknown[];
  }

  async findById(id: string, tenantId: string): Promise<unknown> {
    const res = await this.sb()
      .from(DbTable.Category)
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
      .from(DbTable.Category)
      .update(patch)
      .eq('id', id)
      .eq('tenantId', tenantId)
      .select('*')
      .maybeSingle();
    ensureNoError(res.error, res.data, 'Category.update');
    return res.data;
  }

  async delete(id: string, tenantId: string): Promise<{ id?: string }> {
    const del = await this.sb()
      .from(DbTable.Category)
      .delete()
      .eq('id', id)
      .eq('tenantId', tenantId)
      .select('id')
      .maybeSingle();
    ensureNoError(del.error, del.data, 'Category.delete');
    return { id: del.data?.id as string | undefined };
  }
}
