/** Porta de persistência do contexto Manutenções (DDD). */
export abstract class MaintenanceRepository {
  abstract listVehicleIdsByTenant(tenantId: string): Promise<string[]>;

  abstract findVehicleInTenant(
    vehicleId: string,
    tenantId: string,
  ): Promise<{ status: string } | null>;

  abstract insertMaintenance(row: Record<string, unknown>): Promise<void>;

  abstract updateVehicle(vehicleId: string, patch: Record<string, unknown>): Promise<void>;

  abstract fetchMaintenanceCreated(maintId: string): Promise<unknown>;

  abstract listMaintenancesForVehicleIds(vehicleIds: string[]): Promise<unknown[]>;

  abstract vehicleExistsInTenant(vehicleId: string, tenantId: string): Promise<boolean>;

  abstract listByVehicleId(vehicleId: string): Promise<unknown[]>;

  abstract findOneWithVehicle(id: string): Promise<Record<string, unknown> | null>;

  abstract updateFields(
    id: string,
    patch: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;

  abstract updateStatusWithVehicle(
    id: string,
    status: string,
    endDate: string | null,
  ): Promise<Record<string, unknown>>;

  abstract getVehicleStatus(vehicleId: string): Promise<{ status: string } | null>;

  abstract setVehicleStatus(vehicleId: string, status: string): Promise<void>;

  abstract deleteServiceOrdersForMaintenance(maintenanceId: string): Promise<void>;

  abstract deleteMaintenanceById(id: string): Promise<void>;

  abstract countPendingOrInProgressForVehicle(vehicleId: string): Promise<number>;

  abstract listCostRowsForVehicleIds(
    vehicleIds: string[],
  ): Promise<Array<{ status: string; cost: number; createdAt: string }>>;
}
