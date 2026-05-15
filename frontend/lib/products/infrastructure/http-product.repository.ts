import { API_ROUTES } from '@/lib/api';
import api from '@/lib/axios';
import type { Product } from '../domain/product.types';
import { ProductRepository } from '../domain/repositories/product.repository';

export class HttpProductRepository extends ProductRepository {
  getAll(): Promise<Product[]> {
    return api.get<Product[]>(API_ROUTES.products.getAll).then((r) => r.data);
  }

  create(data: {
    name: string;
    sku: string;
    unit?: string;
    quantityOnHand?: number;
    minStock?: number;
    categoryId?: string;
    supplierId?: string;
  }) {
    return api.post(API_ROUTES.products.create, data).then((r) => r.data);
  }

  update(
    id: string,
    data: Partial<{
      name: string;
      sku: string;
      unit: string;
      minStock: number;
      categoryId: string | null;
      supplierId: string | null;
    }>,
  ) {
    return api.patch(API_ROUTES.products.update(id), data).then((r) => r.data);
  }

  delete(id: string) {
    return api.delete(API_ROUTES.products.delete(id)).then((r) => r.data);
  }

  adjustStock(id: string, quantityOnHand: number, note?: string) {
    return api
      .patch(API_ROUTES.products.adjustStock(id), { quantityOnHand, note })
      .then((r) => r.data);
  }

  addMovement(id: string, body: { type: 'IN' | 'OUT'; quantity: number; note?: string }) {
    return api.post(API_ROUTES.products.addMovement(id), body).then((r) => r.data);
  }

  getMovements(productId?: string) {
    const q = productId ? `?productId=${encodeURIComponent(productId)}` : '';
    return api.get(`${API_ROUTES.products.movements}${q}`).then((r) => r.data);
  }
}
