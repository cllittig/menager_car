import { Test, TestingModule } from '@nestjs/testing';
import { TenantResolutionService } from '../core/application/tenant-resolution.service';
import { ClientsApplicationService } from './application/clients.application-service';
import { ClientRepository } from './domain/repositories/client.repository';

describe('ClientsService (escopo: Clientes / Dashboard)', () => {
  let service: ClientsApplicationService;

  const dto = {
    name: 'Cliente Teste',
    email: 'cliente@test.com',
    phone: '11999990000',
    cpf: '12345678901',
    cnh: 'CNH123',
    address: 'Rua A',
  };

  it('create envia updatedAt obrigatório ao Supabase', async () => {
    const insertClient = jest.fn().mockImplementation((p: Record<string, unknown>) =>
      Promise.resolve({ id: 'cl-1', ...p }),
    );
    const mockRepo: Partial<ClientRepository> = {
      findByCpf: jest.fn().mockResolvedValue(null),
      findByEmail: jest.fn().mockResolvedValue(null),
      insertClient,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsApplicationService,
        {
          provide: TenantResolutionService,
          useValue: { getTenantIdByUserIdOrThrow: jest.fn().mockResolvedValue('ten-1') },
        },
        { provide: ClientRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(ClientsApplicationService);
    await service.create(dto as never, 'user-1');

    const call = insertClient.mock.calls[0] as [Record<string, unknown>] | undefined;
    expect(call).toBeDefined();
    const inserted = call![0];
    expect(inserted['tenantId']).toBe('ten-1');
    expect(inserted['userId']).toBe('user-1');
    expect(typeof inserted['updatedAt']).toBe('string');
  });
});
