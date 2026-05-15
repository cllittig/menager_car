import type { Supplier } from '../supplier.types';

export abstract class SupplierRepository {
  abstract getAll(): Promise<Supplier[]>;

  abstract create(data: Partial<Supplier> & { name: string }): Promise<unknown>;

  abstract update(id: string, data: Partial<Supplier>): Promise<unknown>;

  abstract delete(id: string): Promise<unknown>;
}
