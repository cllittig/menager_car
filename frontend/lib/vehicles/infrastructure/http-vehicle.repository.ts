import { API_ROUTES } from '@/lib/api';
import api from '@/lib/axios';
import type { Vehicle } from '../domain/vehicle.types';
import { VehicleRepository } from '../domain/repositories/vehicle.repository';

export class HttpVehicleRepository extends VehicleRepository {
  async getAll(): Promise<Vehicle[]> {
    const response = await api.get<Vehicle[]>(API_ROUTES.vehicles.getAll);
    return response.data;
  }

  async getOne(id: string): Promise<Vehicle> {
    const response = await api.get<Vehicle>(API_ROUTES.vehicles.getOne(id));
    return response.data;
  }

  async create(data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    const response = await api.post<Vehicle>(API_ROUTES.vehicles.create, data);
    return response.data;
  }

  async update(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const response = await api.patch<Vehicle>(API_ROUTES.vehicles.update(id), data);
    return response.data;
  }

  async delete(id: string): Promise<unknown> {
    const response = await api.delete(API_ROUTES.vehicles.delete(id));
    return response.data;
  }
}
