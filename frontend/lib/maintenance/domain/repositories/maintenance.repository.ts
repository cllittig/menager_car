import type { CreateMaintenanceDto, Maintenance } from '../maintenance.types';

export abstract class MaintenanceRepository {
  abstract getAll(): Promise<Maintenance[]>;

  abstract getById(id: string): Promise<Maintenance>;

  abstract create(data: CreateMaintenanceDto): Promise<Maintenance>;

  abstract update(id: string, data: Partial<CreateMaintenanceDto>): Promise<Maintenance>;

  abstract delete(id: string): Promise<void>;
}
