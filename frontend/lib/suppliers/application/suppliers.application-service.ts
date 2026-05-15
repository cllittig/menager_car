import { HttpSupplierRepository } from '../infrastructure/http-supplier.repository';
import type { Supplier } from '../domain/supplier.types';
import { SupplierRepository } from '../domain/repositories/supplier.repository';

const defaultRepository = new HttpSupplierRepository();

export class SuppliersApplicationService {
  constructor(private readonly repository: SupplierRepository = defaultRepository) {}

  getAll() {
    return this.repository.getAll();
  }

  create(data: Partial<Supplier> & { name: string }) {
    return this.repository.create(data);
  }

  update(id: string, data: Partial<Supplier>) {
    return this.repository.update(id, data);
  }

  delete(id: string) {
    return this.repository.delete(id);
  }
}
