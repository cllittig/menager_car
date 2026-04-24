/** Porta de persistência do contexto Relatórios (DDD). */
export abstract class ReportRepository {
  abstract insertSnapshot(row: Record<string, unknown>): Promise<unknown>;

  abstract listSnapshotHistory(tenantId: string): Promise<unknown[]>;

  abstract getSnapshotById(id: string, tenantId: string): Promise<unknown>;

  abstract listSchedules(tenantId: string): Promise<unknown[]>;

  abstract insertSchedule(row: Record<string, unknown>): Promise<unknown>;

  abstract findScheduleId(id: string, tenantId: string): Promise<{ id: string } | null>;

  abstract updateSchedule(
    id: string,
    tenantId: string,
    patch: Record<string, unknown>,
  ): Promise<unknown>;

  abstract deleteSchedule(id: string, tenantId: string): Promise<{ id?: string }>;
}
