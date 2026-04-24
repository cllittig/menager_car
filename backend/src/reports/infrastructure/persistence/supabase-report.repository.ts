import { Injectable } from '@nestjs/common';
import { DbTable } from '../../../database/db-tables';
import { ensureNoError } from '../../../supabase/supabase-error.util';
import { SupabaseService } from '../../../supabase/supabase.service';
import { ReportRepository } from '../../domain/repositories/report.repository';

@Injectable()
export class SupabaseReportRepository extends ReportRepository {
  constructor(private readonly supabase: SupabaseService) {
    super();
  }

  private sb() {
    return this.supabase.getClient();
  }

  async insertSnapshot(row: Record<string, unknown>): Promise<unknown> {
    const ins = await this.sb().from(DbTable.ReportSnapshot).insert(row).select('*').single();
    ensureNoError(ins.error, ins.data, 'ReportSnapshot.create');
    return ins.data;
  }

  async listSnapshotHistory(tenantId: string): Promise<unknown[]> {
    const res = await this.sb()
      .from(DbTable.ReportSnapshot)
      .select('id, reportType, title, createdAt, generatedBy')
      .eq('tenantId', tenantId)
      .order('createdAt', { ascending: false })
      .limit(100);
    ensureNoError(res.error, res.data, 'ReportSnapshot.list');
    return (res.data ?? []) as unknown[];
  }

  async getSnapshotById(id: string, tenantId: string): Promise<unknown> {
    const res = await this.sb()
      .from(DbTable.ReportSnapshot)
      .select('*')
      .eq('id', id)
      .eq('tenantId', tenantId)
      .maybeSingle();
    if (res.error || !res.data) {
      return null;
    }
    return res.data;
  }

  async listSchedules(tenantId: string): Promise<unknown[]> {
    const res = await this.sb()
      .from(DbTable.ReportSchedule)
      .select('*')
      .eq('tenantId', tenantId)
      .order('createdAt', { ascending: false });
    ensureNoError(res.error, res.data, 'ReportSchedule.list');
    return (res.data ?? []) as unknown[];
  }

  async insertSchedule(row: Record<string, unknown>): Promise<unknown> {
    const ins = await this.sb().from(DbTable.ReportSchedule).insert(row).select('*').single();
    ensureNoError(ins.error, ins.data, 'ReportSchedule.create');
    return ins.data;
  }

  async findScheduleId(id: string, tenantId: string): Promise<{ id: string } | null> {
    const existing = await this.sb()
      .from(DbTable.ReportSchedule)
      .select('id')
      .eq('id', id)
      .eq('tenantId', tenantId)
      .maybeSingle();
    return (existing.data as { id: string }) ?? null;
  }

  async updateSchedule(
    id: string,
    tenantId: string,
    patch: Record<string, unknown>,
  ): Promise<unknown> {
    const res = await this.sb()
      .from(DbTable.ReportSchedule)
      .update(patch)
      .eq('id', id)
      .eq('tenantId', tenantId)
      .select('*')
      .maybeSingle();
    ensureNoError(res.error, res.data, 'ReportSchedule.update');
    return res.data;
  }

  async deleteSchedule(id: string, tenantId: string): Promise<{ id?: string }> {
    const del = await this.sb()
      .from(DbTable.ReportSchedule)
      .delete()
      .eq('id', id)
      .eq('tenantId', tenantId)
      .select('id')
      .maybeSingle();
    ensureNoError(del.error, del.data, 'ReportSchedule.delete');
    return { id: del.data?.id as string | undefined };
  }
}
