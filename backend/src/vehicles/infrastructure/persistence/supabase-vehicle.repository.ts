import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DbTable } from '../../../database/db-tables';
import { VehicleStatus } from '../../../database/domain.enums';
import { VehicleRow } from '../../../database/vehicle.types';
import { ensureNoError } from '../../../supabase/supabase-error.util';
import { SupabaseService } from '../../../supabase/supabase.service';
import { IVehicleStats, VehicleWithRelations } from '../../interfaces/vehicle.interface';
import { VehicleRepository } from '../../domain/repositories/vehicle.repository';

@Injectable()
export class SupabaseVehicleRepository extends VehicleRepository {
  constructor(private readonly supabase: SupabaseService) {
    super();
  }

  private sb() {
    return this.supabase.getClient();
  }

  async findDuplicatePlateOrChassis(
    tenantId: string,
    licensePlate: string,
    chassis: string,
  ): Promise<{ licensePlate: string; chassis: string; brand: string; model: string } | null> {
    const orFilter = `licensePlate.eq.${licensePlate},chassis.eq.${chassis}`;
    const existing = await this.sb()
      .from(DbTable.Vehicle)
      .select('id, licensePlate, chassis, brand, model')
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .or(orFilter)
      .maybeSingle();
    return (existing.data as {
      licensePlate: string;
      chassis: string;
      brand: string;
      model: string;
    }) ?? null;
  }

  async insertVehicle(payload: Record<string, unknown>): Promise<VehicleRow> {
    const ins = await this.sb().from(DbTable.Vehicle).insert(payload).select('*').single();
    ensureNoError(ins.error, ins.data, 'Vehicle.create');
    return ins.data as VehicleRow;
  }

  async listVehicles(params: {
    tenantId: string;
    skip?: number;
    take?: number;
    status?: string;
    search?: string;
  }): Promise<VehicleRow[]> {
    const { tenantId, skip, take, status, search } = params;
    let q = this.sb()
      .from(DbTable.Vehicle)
      .select('*')
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .order('createdAt', { ascending: false });

    if (status) {
      q = q.eq('status', status);
    }
    if (search) {
      const s = `%${search}%`;
      q = q.or(`brand.ilike.${s},model.ilike.${s},licensePlate.ilike.${s}`);
    }
    if (skip !== undefined) {
      q = q.range(skip, skip + (take ?? 50) - 1);
    } else if (take !== undefined) {
      q = q.limit(take);
    }

    const res = await q;
    ensureNoError(res.error, res.data, 'Vehicle.findAll');
    return (res.data ?? []) as VehicleRow[];
  }

  async findOneWithRelations(id: string, tenantId: string): Promise<VehicleWithRelations | null> {
    const res = await this.sb()
      .from(DbTable.Vehicle)
      .select('*, Maintenance (*), Transaction (*)')
      .eq('id', id)
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .maybeSingle();
    if (res.error || !res.data) {
      return null;
    }
    return res.data as VehicleWithRelations;
  }

  async existsActiveVehicle(id: string, tenantId: string): Promise<boolean> {
    const exists = await this.sb()
      .from(DbTable.Vehicle)
      .select('id')
      .eq('id', id)
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .maybeSingle();
    return Boolean(exists.data);
  }

  async findDuplicateForUpdate(
    tenantId: string,
    excludeVehicleId: string,
    licensePlate?: string,
    chassis?: string,
  ): Promise<{ licensePlate: string; chassis: string } | null> {
    const orParts: string[] = [];
    if (licensePlate) orParts.push(`licensePlate.eq.${licensePlate}`);
    if (chassis) orParts.push(`chassis.eq.${chassis}`);
    if (orParts.length === 0) {
      return null;
    }
    const dup = await this.sb()
      .from(DbTable.Vehicle)
      .select('licensePlate, chassis')
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .neq('id', excludeVehicleId)
      .or(orParts.join(','))
      .maybeSingle();
    return (dup.data as { licensePlate: string; chassis: string }) ?? null;
  }

  async updateVehicle(id: string, patch: Record<string, unknown>): Promise<VehicleRow> {
    const upd = await this.sb().from(DbTable.Vehicle).update(patch).eq('id', id).select('*').single();
    ensureNoError(upd.error, upd.data, 'Vehicle.update');
    return upd.data as VehicleRow;
  }

  async listTransactionIdsForVehicle(vehicleId: string, tenantId: string): Promise<string[]> {
    const txs = await this.sb()
      .from(DbTable.Transaction)
      .select('id')
      .eq('vehicleId', vehicleId)
      .eq('tenantId', tenantId);
    ensureNoError(txs.error, txs.data, 'Transaction.listByVehicle');
    return (txs.data ?? []).map((t: { id: string }) => t.id);
  }

  async hasContractForTransactionIds(tenantId: string, transactionIds: string[]): Promise<boolean> {
    if (transactionIds.length === 0) {
      return false;
    }
    const contracts = await this.sb()
      .from(DbTable.Contract)
      .select('id')
      .eq('tenantId', tenantId)
      .in('transactionId', transactionIds)
      .limit(1);
    ensureNoError(contracts.error, contracts.data, 'Contract.byTransaction');
    return (contracts.data ?? []).length > 0;
  }

  async softDeleteVehicle(id: string, userId: string): Promise<VehicleRow> {
    const soft = await this.sb()
      .from(DbTable.Vehicle)
      .update({
        deletedAt: new Date().toISOString(),
        deletedBy: userId,
        isActive: false,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();
    ensureNoError(soft.error, soft.data, 'Vehicle.softDelete');
    return soft.data as VehicleRow;
  }

  async countVehicles(tenantId: string, extra: Record<string, unknown>): Promise<number> {
    const res = await this.sb()
      .from(DbTable.Vehicle)
      .select('id', { count: 'exact', head: true })
      .eq('tenantId', tenantId)
      .is('deletedAt', null)
      .match(extra);
    if (res.error) {
      throw new InternalServerErrorException(`Vehicle.count: ${res.error.message}`);
    }
    return res.count ?? 0;
  }

  async getStatsCounts(tenantId: string): Promise<IVehicleStats> {
    const [total, available, maintenance, sold, reserved] = await Promise.all([
      this.countVehicles(tenantId, {}),
      this.countVehicles(tenantId, { status: VehicleStatus.AVAILABLE }),
      this.countVehicles(tenantId, { status: VehicleStatus.MAINTENANCE }),
      this.countVehicles(tenantId, { status: VehicleStatus.SOLD }),
      this.countVehicles(tenantId, { status: VehicleStatus.RESERVED }),
    ]);
    return { total, available, maintenance, sold, reserved };
  }
}
