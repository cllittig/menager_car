import type { AvailableTransaction, Contract, CreateContractDto } from '../contract.types';

export abstract class ContractRepository {
  abstract getAll(): Promise<Contract[]>;

  abstract getById(id: string): Promise<Contract>;

  abstract create(data: CreateContractDto): Promise<Contract>;

  abstract delete(id: string): Promise<void>;

  abstract download(id: string): Promise<Blob>;

  abstract getAvailableTransactions(): Promise<AvailableTransaction[]>;
}
