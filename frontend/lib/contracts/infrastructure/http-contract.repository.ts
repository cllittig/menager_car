import { API_ROUTES } from '@/lib/api';
import api from '@/lib/axios';
import type { AvailableTransaction, Contract, CreateContractDto } from '../domain/contract.types';
import { ContractRepository } from '../domain/repositories/contract.repository';

export class HttpContractRepository extends ContractRepository {
  async getAll(): Promise<Contract[]> {
    const response = await api.get(API_ROUTES.contracts.getAll);
    return response.data;
  }

  async getById(id: string): Promise<Contract> {
    const response = await api.get(API_ROUTES.contracts.getOne(id));
    return response.data;
  }

  async create(data: CreateContractDto): Promise<Contract> {
    const formData = new FormData();
    formData.append('transactionId', data.transactionId);
    formData.append('file', data.file);
    formData.append('transactionType', data.transactionType);
    formData.append('transactionAmount', data.transactionAmount.toString());

    const response = await api.post(API_ROUTES.contracts.create, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(API_ROUTES.contracts.delete(id));
  }

  async download(id: string): Promise<Blob> {
    const response = await api.get(API_ROUTES.contracts.download(id), {
      responseType: 'blob',
    });
    return response.data;
  }

  async getAvailableTransactions(): Promise<AvailableTransaction[]> {
    const response = await api.get(API_ROUTES.contracts.availableTransactions);
    return response.data;
  }
}
