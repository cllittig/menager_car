import { HttpClientRepository } from '../infrastructure/http-client.repository';
import type { Client } from '../domain/client.types';
import { ClientRepository } from '../domain/repositories/client.repository';

const defaultRepository = new HttpClientRepository();

export class ClientsApplicationService {
  constructor(private readonly repository: ClientRepository = defaultRepository) {}

  async getAll() {
    return this.repository.getAll();
  }

  async getOne(id: string) {
    return this.repository.getOne(id);
  }

  async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.repository.create(data);
  }

  async update(id: string, data: Partial<Client>) {
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }

  async getStats() {
    return this.repository.getStats();
  }
}
