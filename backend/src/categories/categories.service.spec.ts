import { Test, TestingModule } from '@nestjs/testing';
import { TenantResolutionService } from '../core/application/tenant-resolution.service';
import { CategoriesApplicationService } from './application/categories.application-service';
import { CategoryRepository } from './domain/repositories/category.repository';

describe('CategoriesService (escopo: Produtos / categorias)', () => {
  let service: CategoriesApplicationService;

  it('create grava createdAt e updatedAt', async () => {
    const insert = jest.fn().mockResolvedValue({ id: 'cat-1', name: 'Peças' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesApplicationService,
        {
          provide: CategoryRepository,
          useValue: {
            findByName: jest.fn().mockResolvedValue(null),
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

    service = module.get(CategoriesApplicationService);
    await service.create({ name: 'Peças', description: 'Cat' }, 'user-1');

    const calls = insert.mock.calls as Array<[Record<string, unknown>]>;
    const row = calls[0][0];
    expect(row.createdAt).toBeDefined();
    expect(row.updatedAt).toBeDefined();
    expect(row.tenantId).toBe('ten-1');
  });
});
