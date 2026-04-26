import { Test, TestingModule } from '@nestjs/testing';
import { TenantResolutionService } from '../core/application/tenant-resolution.service';
import { SuppliersApplicationService } from './application/suppliers.application-service';
import { SupplierRepository } from './domain/repositories/supplier.repository';

describe('SuppliersService (escopo: Fornecedores)', () => {
  let service: SuppliersApplicationService;

  it('create grava timestamps e tenant', async () => {
    const insert = jest.fn().mockResolvedValue({ id: 'sup-1', name: 'Forn A' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersApplicationService,
        {
          provide: SupplierRepository,
          useValue: {
            insert,
            listAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: TenantResolutionService,
          useValue: { getTenantIdByUserIdOrThrow: jest.fn().mockResolvedValue('ten-1') },
        },
      ],
    }).compile();

    service = module.get(SuppliersApplicationService);
    await service.create({ name: 'Forn A' }, 'user-1');

    const call = insert.mock.calls[0] as [Record<string, unknown>] | undefined;
    expect(call).toBeDefined();
    const row = call![0];
    expect(row['tenantId']).toBe('ten-1');
    expect(row['name']).toBe('Forn A');
    expect(typeof row['updatedAt']).toBe('string');
  });
});
