import { VehicleRow } from '../../../database/vehicle.types';
import { IVehicleStats, VehicleWithRelations } from '../../interfaces/vehicle.interface';

/** Porta de persistência do agregado Veículo (DDD: repositório do domínio). */
export abstract class VehicleRepository {
  abstract findDuplicatePlateOrChassis(
    tenantId: string,
    licensePlate: string,
    chassis: string,
  ): Promise<{
    licensePlate: string;
    chassis: string;
    brand: string;
    model: string;
  } | null>;

  abstract insertVehicle(payload: Record<string, unknown>): Promise<VehicleRow>;

  abstract listVehicles(params: {
    tenantId: string;
    skip?: number;
    take?: number;
    status?: string;
    search?: string;
  }): Promise<VehicleRow[]>;

  abstract findOneWithRelations(id: string, tenantId: string): Promise<VehicleWithRelations | null>;

  abstract existsActiveVehicle(id: string, tenantId: string): Promise<boolean>;

  abstract findDuplicateForUpdate(
    tenantId: string,
    excludeVehicleId: string,
    licensePlate?: string,
    chassis?: string,
  ): Promise<{ licensePlate: string; chassis: string } | null>;

  abstract updateVehicle(
    id: string,
    patch: Record<string, unknown>,
  ): Promise<VehicleRow>;

  abstract listTransactionIdsForVehicle(vehicleId: string, tenantId: string): Promise<string[]>;

  abstract hasContractForTransactionIds(tenantId: string, transactionIds: string[]): Promise<boolean>;

  abstract softDeleteVehicle(id: string, userId: string): Promise<VehicleRow>;

  abstract countVehicles(tenantId: string, match: Record<string, unknown>): Promise<number>;

  abstract getStatsCounts(tenantId: string): Promise<IVehicleStats>;
}
