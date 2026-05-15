import { API_ROUTES } from '@/lib/api';
import api from '@/lib/axios';
import type { CreateSaleDto, Sale } from '../domain/sale.types';
import { SaleRepository } from '../domain/repositories/sale.repository';

export class HttpSaleRepository extends SaleRepository {
  async getAll(): Promise<Sale[]> {
    const response = await api.get(API_ROUTES.sales.getAll);
    return response.data;
  }

  async getById(id: string): Promise<Sale> {
    const response = await api.get(API_ROUTES.sales.getOne(id));
    return response.data;
  }

  async create(data: CreateSaleDto): Promise<Sale> {
    const response = await api.post(API_ROUTES.sales.create, data);
    return response.data;
  }

  async update(id: string, data: Partial<CreateSaleDto>): Promise<Sale> {
    const response = await api.patch(API_ROUTES.sales.update(id), data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(API_ROUTES.sales.delete(id));
  }
}
