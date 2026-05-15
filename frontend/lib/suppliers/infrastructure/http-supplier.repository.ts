import { API_ROUTES } from '@/lib/api';
import api from '@/lib/axios';
import type { Supplier } from '../domain/supplier.types';
import { SupplierRepository } from '../domain/repositories/supplier.repository';

export class HttpSupplierRepository extends SupplierRepository {
  getAll(): Promise<Supplier[]> {
    return api.get<Supplier[]>(API_ROUTES.suppliers.getAll).then((r) => r.data);
  }

  create(data: Partial<Supplier> & { name: string }) {
    return api.post(API_ROUTES.suppliers.create, data).then((r) => r.data);
  }

  update(id: string, data: Partial<Supplier>) {
    return api.patch(API_ROUTES.suppliers.update(id), data).then((r) => r.data);
  }

  delete(id: string) {
    return api.delete(API_ROUTES.suppliers.delete(id)).then((r) => r.data);
  }
}
