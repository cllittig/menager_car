import { Injectable } from '@nestjs/common';
import { DbTable } from '../../../database/db-tables';
import { PaymentStatus, TransactionType } from '../../../database/domain.enums';
import { ensureNoError } from '../../../supabase/supabase-error.util';
import { SupabaseService } from '../../../supabase/supabase.service';
import { DashboardRepository } from '../../domain/repositories/dashboard.repository';

@Injectable()
export class SupabaseDashboardRepository extends DashboardRepository {
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

  async countVehicles(tenantId: string, match: Record<string, unknown>): Promise<number> {
    const res = await this.sb()
      .from(DbTable.Vehicle)
      .select('id', { count: 'exact', head: true })
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .match(match);
    return res.count ?? 0;
  }

  async countActiveClients(tenantId: string): Promise<number> {
    const totalClientsRes = await this.sb()
      .from(DbTable.Client)
      .select('id', { count: 'exact', head: true })
      .eq('tenantId', tenantId)
      .is('deletedAt', null);
    return totalClientsRes.count ?? 0;
  }

  async listTransactionsForVehicles(vehicleIds: string[]): Promise<
    Array<{
      type: TransactionType;
      status: PaymentStatus;
      amount: number;
      createdAt: string;
      vehicleId: string;
    }>
  > {
    const txRes = await this.sb()
      .from(DbTable.Transaction)
      .select('type, status, amount, createdAt, vehicleId')
      .in('vehicleId', vehicleIds);
    ensureNoError(txRes.error, txRes.data, 'Dashboard.transactions');
    return (txRes.data ?? []).map(
      (row: {
        type: string;
        status: string;
        amount: number;
        createdAt: string;
        vehicleId: string;
      }) => ({
        type: row.type as TransactionType,
        status: row.status as PaymentStatus,
        amount: row.amount,
        createdAt: row.createdAt,
        vehicleId: row.vehicleId,
      }),
    );
  }

  async sumCompletedMaintenanceCosts(vehicleIds: string[]): Promise<Array<{ cost: number }>> {
    const maintRes = await this.sb()
      .from(DbTable.Maintenance)
      .select('cost')
      .in('vehicleId', vehicleIds)
      .neq('status', 'CANCELLED');
    ensureNoError(maintRes.error, maintRes.data, 'Dashboard.maintenance');
    return (maintRes.data ?? []) as Array<{ cost: number }>;
  }

  async listContractTransactionIds(tenantId: string): Promise<string[]> {
    const contractsRes = await this.sb()
      .from(DbTable.Contract)
      .select('transactionId')
      .eq('tenantId', tenantId);
    return [...new Set((contractsRes.data ?? []).map((c: { transactionId: string }) => c.transactionId))];
  }

  async countTransactionsMatching(
    transactionIds: string[],
    vehicleIds: string[],
  ): Promise<number> {
    if (transactionIds.length === 0) {
      return 0;
    }
    const txV = await this.sb()
      .from(DbTable.Transaction)
      .select('id')
      .in('id', transactionIds)
      .in('vehicleId', vehicleIds);
    return (txV.data ?? []).length;
  }

  async listVehiclesBriefByTenant(
    tenantId: string,
  ): Promise<Array<{ id: string; brand: string; model: string; year: number }>> {
    const v = await this.sb()
      .from(DbTable.Vehicle)
      .select('id, brand, model, year')
      .eq('tenantId', tenantId)
      .is('deletedAt', null);
    ensureNoError(v.error, v.data, 'Dashboard.vehiclesBrief');
    return (v.data ?? []) as Array<{ id: string; brand: string; model: string; year: number }>;
  }
}
