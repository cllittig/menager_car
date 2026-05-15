import type { Product } from '../product.types';

export abstract class ProductRepository {
  abstract getAll(): Promise<Product[]>;

  abstract create(data: {
    name: string;
    sku: string;
    unit?: string;
    quantityOnHand?: number;
    minStock?: number;
    categoryId?: string;
    supplierId?: string;
  }): Promise<unknown>;

  abstract update(
    id: string,
    data: Partial<{
      name: string;
      sku: string;
      unit: string;
      minStock: number;
      categoryId: string | null;
      supplierId: string | null;
    }>,
  ): Promise<unknown>;

  abstract delete(id: string): Promise<unknown>;

  abstract adjustStock(id: string, quantityOnHand: number, note?: string): Promise<unknown>;

  abstract addMovement(
    id: string,
    body: { type: 'IN' | 'OUT'; quantity: number; note?: string },
  ): Promise<unknown>;

  abstract getMovements(productId?: string): Promise<unknown>;
}
