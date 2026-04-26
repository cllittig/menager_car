import { Injectable } from '@nestjs/common';
import { DbTable } from '../../../database/db-tables';
import { MaintenanceStatus } from '../../../database/domain.enums';
import { ensureNoError } from '../../../supabase/supabase-error.util';
import { SupabaseService } from '../../../supabase/supabase.service';
import { MaintenanceRepository } from '../../domain/repositories/maintenance.repository';

@Injectable()
export class SupabaseMaintenanceRepository extends MaintenanceRepository {
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

  async findVehicleInTenant(
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

  async insertMaintenance(row: Record<string, unknown>): Promise<void> {
    const ins = await this.sb().from(DbTable.Maintenance).insert(row).select('*').single();
    if (ins.error) {
      ensureNoError(ins.error, ins.data, 'Maintenance.create');
    }
  }

  async updateVehicle(vehicleId: string, patch: Record<string, unknown>): Promise<void> {
    await this.sb().from(DbTable.Vehicle).update(patch).eq('id', vehicleId);
  }

  async fetchMaintenanceCreated(maintId: string): Promise<unknown> {
    const full = await this.sb()
      .from(DbTable.Maintenance)
      .select(
        `*,
        Vehicle ( brand, model, year, licensePlate )
      `,
      )
      .eq('id', maintId)
      .single();
    ensureNoError(full.error, full.data, 'Maintenance.fetchCreated');
    const row = full.data as Record<string, unknown>;
    const { Vehicle: veh, ...rest } = row;
    return { ...rest, vehicle: veh };
  }

  async listMaintenancesForVehicleIds(vehicleIds: string[]): Promise<unknown[]> {
    const res = await this.sb()
      .from(DbTable.Maintenance)
      .select(
        `*,
        Vehicle ( brand, model, year, licensePlate, color )
      `,
      )
      .in('vehicleId', vehicleIds)
      .order('createdAt', { ascending: false });
    ensureNoError(res.error, res.data, 'Maintenance.findAll');
    return (res.data ?? []).map((r: Record<string, unknown>) => {
      const { Vehicle: veh, ...rest } = r;
      return { ...rest, vehicle: veh };
    });
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

  async listByVehicleId(vehicleId: string): Promise<unknown[]> {
    const res = await this.sb()
      .from(DbTable.Maintenance)
      .select('*')
      .eq('vehicleId', vehicleId)
      .order('createdAt', { ascending: false });
    ensureNoError(res.error, res.data, 'Maintenance.byVehicle');
    return (res.data ?? []) as unknown[];
  }

  async findOneWithVehicle(id: string): Promise<Record<string, unknown> | null> {
    const res = await this.sb()
      .from(DbTable.Maintenance)
      .select(
        `*,
        Vehicle (*)
      `,
      )
      .eq('id', id)
      .maybeSingle();
    if (res.error || !res.data) {
      return null;
    }
    const rec = res.data as Record<string, unknown>;
    const { Vehicle: veh, ...rest } = rec;
    return { ...rest, vehicle: veh };
  }

  async updateFields(
    id: string,
    patch: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const upd = await this.sb()
      .from(DbTable.Maintenance)
      .update(patch)
      .eq('id', id)
      .select(
        `*,
        Vehicle ( brand, model, year, licensePlate, color )
      `,
      )
      .single();
    ensureNoError(upd.error, upd.data, 'Maintenance.update');
    const row = upd.data as Record<string, unknown>;
    const { Vehicle: veh, ...rest } = row;
    return { ...rest, vehicle: veh };
  }

  async updateStatusWithVehicle(
    id: string,
    status: string,
    endDate: string | null,
  ): Promise<Record<string, unknown>> {
    const upd = await this.sb()
      .from(DbTable.Maintenance)
      .update({
        status,
        endDate,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `*,
        Vehicle (*)
      `,
      )
      .single();
    ensureNoError(upd.error, upd.data, 'Maintenance.updateStatus');
    const row = upd.data as Record<string, unknown>;
    const { Vehicle: vh, ...rest } = row;
    return { ...rest, vehicle: vh };
  }

  async getVehicleStatus(vehicleId: string): Promise<{ status: string } | null> {
    const vehRes = await this.sb()
      .from(DbTable.Vehicle)
      .select('status')
      .eq('id', vehicleId)
      .maybeSingle();
    return (vehRes.data as { status: string }) ?? null;
  }

  async setVehicleStatus(vehicleId: string, status: string): Promise<void> {
    await this.sb()
      .from(DbTable.Vehicle)
      .update({ status, updatedAt: new Date().toISOString() })
      .eq('id', vehicleId);
  }

  async deleteServiceOrdersForMaintenance(maintenanceId: string): Promise<void> {
    await this.sb().from(DbTable.ServiceOrder).delete().eq('maintenanceId', maintenanceId);
  }

  async deleteMaintenanceById(id: string): Promise<void> {
    await this.sb().from(DbTable.Maintenance).delete().eq('id', id);
  }

  async countPendingOrInProgressForVehicle(vehicleId: string): Promise<number> {
    const pendingRes = await this.sb()
      .from(DbTable.Maintenance)
      .select('id', { count: 'exact', head: true })
      .eq('vehicleId', vehicleId)
      .in('status', [MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS]);
    return pendingRes.count ?? 0;
  }

  async listCostRowsForVehicleIds(
    vehicleIds: string[],
  ): Promise<Array<{ status: string; cost: number; createdAt: string }>> {
    const res = await this.sb()
      .from(DbTable.Maintenance)
      .select('status, cost, createdAt')
      .in('vehicleId', vehicleIds);
    ensureNoError(res.error, res.data, 'Maintenance.stats');
    return (res.data ?? []) as Array<{ status: string; cost: number; createdAt: string }>;
  }
}
