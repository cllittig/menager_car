import { HttpContractRepository } from '../infrastructure/http-contract.repository';
import type { CreateContractDto } from '../domain/contract.types';
import { ContractRepository } from '../domain/repositories/contract.repository';

const defaultRepository = new HttpContractRepository();

export class ContractsApplicationService {
  constructor(private readonly repository: ContractRepository = defaultRepository) {}

  async getAll() {
    return this.repository.getAll();
  }

  async getById(id: string) {
    return this.repository.getById(id);
  }

  async create(data: CreateContractDto) {
    return this.repository.create(data);
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }

  async download(id: string) {
    return this.repository.download(id);
  }

  async getAvailableTransactions() {
    return this.repository.getAvailableTransactions();
  }
}
