import { API_ROUTES } from '@/lib/api';
import api from '@/lib/axios';
import type { Client, ClientStats } from '../domain/client.types';
import { ClientRepository } from '../domain/repositories/client.repository';

export class HttpClientRepository extends ClientRepository {
  async getAll(): Promise<Client[]> {
    const response = await api.get<Client[]>(API_ROUTES.clients.getAll);
    return response.data;
  }

  async getOne(id: string): Promise<Client> {
    const response = await api.get<Client>(API_ROUTES.clients.getOne(id));
    return response.data;
  }

  async create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const response = await api.post<Client>(API_ROUTES.clients.create, data);
    return response.data;
  }

  async update(id: string, data: Partial<Client>): Promise<Client> {
    const response = await api.patch<Client>(API_ROUTES.clients.update(id), data);
    return response.data;
  }

  async delete(id: string): Promise<unknown> {
    const response = await api.delete(API_ROUTES.clients.delete(id));
    return response.data;
  }

  async getStats(): Promise<ClientStats> {
    const response = await api.get(API_ROUTES.clients.stats);
    return response.data;
  }
}
