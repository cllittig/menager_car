import { Test, TestingModule } from '@nestjs/testing';
import { TenantResolutionService } from '../core/application/tenant-resolution.service';
import { ProductsApplicationService } from './application/products.application-service';
import { ProductRepository } from './domain/repositories/product.repository';

describe('ProductsService (escopo: Produtos / Estoque)', () => {
  let service: ProductsApplicationService;

  it('create com estoque zero não insere StockMovement', async () => {
    const insertStockMovement = jest.fn();
    const insertProduct = jest.fn().mockResolvedValue({ id: 'p1', quantityOnHand: 0 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsApplicationService,
        {
          provide: ProductRepository,
          useValue: {
            categoryExistsInTenant: jest.fn().mockResolvedValue(true),
            supplierExistsInTenant: jest.fn().mockResolvedValue(true),
            findSkuDuplicate: jest.fn().mockResolvedValue(false),
            insertProduct,
            insertStockMovement,
            listProductsWithRelations: jest.fn(),
            findProductWithRelations: jest.fn(),
            updateProduct: jest.fn(),
            deleteProduct: jest.fn(),
            findProductQuantity: jest.fn(),
            insertStockMovementRow: jest.fn(),
            updateProductQuantity: jest.fn(),
            listStockMovements: jest.fn(),
          },
        },
        {
          provide: TenantResolutionService,
          useValue: { getTenantIdByUserIdOrThrow: jest.fn().mockResolvedValue('ten-1') },
        },
      ],
    }).compile();

    service = module.get(ProductsApplicationService);
    await service.create({ name: 'Filtro', sku: 'SKU-1' }, 'user-1');

    expect(insertProduct).toHaveBeenCalled();
    expect(insertStockMovement).not.toHaveBeenCalled();
  });

  it('create com estoque inicial gera movimento IN', async () => {
    const insertStockMovement = jest.fn().mockResolvedValue(undefined);
    const insertProduct = jest.fn().mockResolvedValue({ id: 'p2', quantityOnHand: 5 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsApplicationService,
        {
          provide: ProductRepository,
          useValue: {
            categoryExistsInTenant: jest.fn().mockResolvedValue(true),
            supplierExistsInTenant: jest.fn().mockResolvedValue(true),
            findSkuDuplicate: jest.fn().mockResolvedValue(false),
            insertProduct,
            insertStockMovement,
            listProductsWithRelations: jest.fn(),
            findProductWithRelations: jest.fn(),
            updateProduct: jest.fn(),
            deleteProduct: jest.fn(),
            findProductQuantity: jest.fn(),
            insertStockMovementRow: jest.fn(),
            updateProductQuantity: jest.fn(),
            listStockMovements: jest.fn(),
          },
        },
        {
          provide: TenantResolutionService,
          useValue: { getTenantIdByUserIdOrThrow: jest.fn().mockResolvedValue('ten-1') },
        },
      ],
    }).compile();

    service = module.get(ProductsApplicationService);
    await service.create({ name: 'Óleo', sku: 'SKU-2', quantityOnHand: 5 }, 'user-1');

    expect(insertStockMovement).toHaveBeenCalledTimes(1);
    const call = insertStockMovement.mock.calls[0] as [Record<string, unknown>] | undefined;
    expect(call).toBeDefined();
    const mov = call![0];
    expect(mov['type']).toBe('IN');
    expect(mov['quantity']).toBe(5);
    expect(mov['balanceAfter']).toBe(5);
    expect(mov['tenantId']).toBe('ten-1');
  });
});
