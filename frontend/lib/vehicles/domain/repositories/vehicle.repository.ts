import type { Vehicle } from '../vehicle.types';

/** Porta de acesso a veículos (DDD: persistência / API). */
export abstract class VehicleRepository {
  abstract getAll(): Promise<Vehicle[]>;

  abstract getOne(id: string): Promise<Vehicle>;

  abstract create(data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle>;

  abstract update(id: string, data: Partial<Vehicle>): Promise<Vehicle>;

  abstract delete(id: string): Promise<unknown>;
}
