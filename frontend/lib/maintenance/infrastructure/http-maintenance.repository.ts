import { API_ROUTES } from '@/lib/api';
import api from '@/lib/axios';
import type { CreateMaintenanceDto, Maintenance } from '../domain/maintenance.types';
import { MaintenanceRepository } from '../domain/repositories/maintenance.repository';

export class HttpMaintenanceRepository extends MaintenanceRepository {
  async getAll(): Promise<Maintenance[]> {
    const response = await api.get(API_ROUTES.maintenance.getAll);
    return response.data;
  }

  async getById(id: string): Promise<Maintenance> {
    const response = await api.get(API_ROUTES.maintenance.getOne(id));
    return response.data;
  }

  async create(data: CreateMaintenanceDto): Promise<Maintenance> {
    const response = await api.post(API_ROUTES.maintenance.create, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateMaintenanceDto>): Promise<Maintenance> {
    const response = await api.patch(API_ROUTES.maintenance.update(id), data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(API_ROUTES.maintenance.delete(id));
  }
}
