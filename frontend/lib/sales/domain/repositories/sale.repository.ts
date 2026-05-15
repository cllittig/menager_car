import type { CreateSaleDto, Sale } from '../sale.types';

export abstract class SaleRepository {
  abstract getAll(): Promise<Sale[]>;

  abstract getById(id: string): Promise<Sale>;

  abstract create(data: CreateSaleDto): Promise<Sale>;

  abstract update(id: string, data: Partial<CreateSaleDto>): Promise<Sale>;

  abstract delete(id: string): Promise<void>;
}
