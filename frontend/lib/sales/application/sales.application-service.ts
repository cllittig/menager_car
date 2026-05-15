import { HttpSaleRepository } from '../infrastructure/http-sale.repository';
import type { CreateSaleDto } from '../domain/sale.types';
import { SaleRepository } from '../domain/repositories/sale.repository';

const defaultRepository = new HttpSaleRepository();

export class SalesApplicationService {
  constructor(private readonly repository: SaleRepository = defaultRepository) {}

  async getAll() {
    return this.repository.getAll();
  }

  async getById(id: string) {
    return this.repository.getById(id);
  }

  async create(data: CreateSaleDto) {
    return this.repository.create(data);
  }

  async update(id: string, data: Partial<CreateSaleDto>) {
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }
}
