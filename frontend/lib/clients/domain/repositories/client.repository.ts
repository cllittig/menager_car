import type { Client, ClientStats } from '../client.types';

export abstract class ClientRepository {
  abstract getAll(): Promise<Client[]>;

  abstract getOne(id: string): Promise<Client>;

  abstract create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client>;

  abstract update(id: string, data: Partial<Client>): Promise<Client>;

  abstract delete(id: string): Promise<unknown>;

  abstract getStats(): Promise<ClientStats>;
}
