import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DbTable } from '../../database/db-tables';
import { ensureNoError } from '../../supabase/supabase-error.util';
import { SupabaseService } from '../../supabase/supabase.service';
import { LoggerService } from './logger.service';

@Injectable()
export class AuditService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly logger: LoggerService,
  ) {}

  private sb() {
    return this.supabase.getClient();
  }

  async log(userId: string, action: string, entity: string, entityId: string, details: unknown) {
    try {
      const res = await this.sb()
        .from(DbTable.AuditLog)
        .insert({
          id: randomUUID(),
          userId,
          action,
          entity,
          entityId,
          details: details as object,
        })
        .select('*')
        .single();
      ensureNoError(res.error, res.data, 'AuditLog.create');
      return res.data as unknown;
    } catch (error) {
      this.logger.error(
        `Erro ao registrar log de auditoria: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async logAction(data: {
    userId: string;
    action: string;
    entity: string;
    entityId: string;
    details: unknown;
    ipAddress?: string;
  }) {
    try {
      const res = await this.sb()
        .from(DbTable.AuditLog)
        .insert({
          id: randomUUID(),
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          details: data.details as object,
          ipAddress: data.ipAddress,
          timestamp: new Date().toISOString(),
        });
      ensureNoError(res.error, res.data, 'AuditLog.logAction');

      this.logger.log(
        `Ação auditada: ${data.action} em ${data.entity} ${data.entityId}`,
        'AuditService',
      );
    } catch (error) {
      this.logger.error(
        `Erro ao registrar auditoria: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
        'AuditService',
      );
      throw error;
    }
  }

  async getAuditLogs(filters: {
    userId?: string;
    entity?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    action?: string;
  }) {
    let q = this.sb()
      .from(DbTable.AuditLog)
      .select(`*, User ( name, email )`)
      .order('timestamp', { ascending: false });

    if (filters.userId) q = q.eq('userId', filters.userId);
    if (filters.entity) q = q.eq('entity', filters.entity);
    if (filters.entityId) q = q.eq('entityId', filters.entityId);
    if (filters.action) q = q.eq('action', filters.action);
    if (filters.startDate && filters.endDate) {
      q = q
        .gte('timestamp', filters.startDate.toISOString())
        .lte('timestamp', filters.endDate.toISOString());
    }

    const res = await q;
    ensureNoError(res.error, res.data, 'AuditLog.list');
    return (res.data ?? []).map((row: Record<string, unknown>) => {
      const { User, ...rest } = row;
      return { ...rest, user: User };
    });
  }

  async getEntityHistory(entity: string, entityId: string) {
    const res = await this.sb()
      .from(DbTable.AuditLog)
      .select(`*, User ( name, email )`)
      .eq('entity', entity)
      .eq('entityId', entityId)
      .order('timestamp', { ascending: false });
    ensureNoError(res.error, res.data, 'AuditLog.history');
    return (res.data ?? []).map((row: Record<string, unknown>) => {
      const { User, ...rest } = row;
      return { ...rest, user: User };
    });
  }
}
