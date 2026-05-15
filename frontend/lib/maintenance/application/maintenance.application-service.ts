import { HttpMaintenanceRepository } from '../infrastructure/http-maintenance.repository';
import type { CreateMaintenanceDto } from '../domain/maintenance.types';
import { MaintenanceRepository } from '../domain/repositories/maintenance.repository';

const defaultRepository = new HttpMaintenanceRepository();

export class MaintenanceApplicationService {
  constructor(private readonly repository: MaintenanceRepository = defaultRepository) {}

  async getAll() {
    return this.repository.getAll();
  }

  async getById(id: string) {
    return this.repository.getById(id);
  }

  async create(data: CreateMaintenanceDto) {
    return this.repository.create(data);
  }

  async update(id: string, data: Partial<CreateMaintenanceDto>) {
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }
}
