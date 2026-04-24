import { HttpVehicleRepository } from '../infrastructure/http-vehicle.repository';
import type { Vehicle } from '../domain/vehicle.types';
import { VehicleRepository } from '../domain/repositories/vehicle.repository';

const defaultRepository = new HttpVehicleRepository();

/**
 * Camada de aplicação do contexto Veículos (orquestra a porta de API).
 */
export class VehiclesApplicationService {
  constructor(private readonly repository: VehicleRepository = defaultRepository) {}

  async getAll() {
    return this.repository.getAll();
  }

  async getOne(id: string) {
    return this.repository.getOne(id);
  }

  async create(data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.repository.create(data);
  }

  async update(id: string, data: Partial<Vehicle>) {
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }
}
