import { HttpProductRepository } from '../infrastructure/http-product.repository';
import { ProductRepository } from '../domain/repositories/product.repository';

const defaultRepository = new HttpProductRepository();

export class ProductsApplicationService {
  constructor(private readonly repository: ProductRepository = defaultRepository) {}

  getAll() {
    return this.repository.getAll();
  }

  create(data: Parameters<ProductRepository['create']>[0]) {
    return this.repository.create(data);
  }

  update(id: string, data: Parameters<ProductRepository['update']>[1]) {
    return this.repository.update(id, data);
  }

  delete(id: string) {
    return this.repository.delete(id);
  }

  adjustStock(id: string, quantityOnHand: number, note?: string) {
    return this.repository.adjustStock(id, quantityOnHand, note);
  }

  addMovement(id: string, body: { type: 'IN' | 'OUT'; quantity: number; note?: string }) {
    return this.repository.addMovement(id, body);
  }

  getMovements(productId?: string) {
    return this.repository.getMovements(productId);
  }
}
