import { Test, TestingModule } from '@nestjs/testing';
import { TenantResolutionService } from '../core/application/tenant-resolution.service';
import { FuelType, VehicleStatus } from '../database/domain.enums';
import { CacheService } from '../shared/services/cache.service';
import { VehiclesApplicationService } from './application/vehicles.application-service';
import { VehicleRepository } from './domain/repositories/vehicle.repository';
import { VehiclesService } from './vehicles.service';

describe('VehiclesService (escopo: Veículos / Dashboard estoque)', () => {
  let service: VehiclesService;

  const baseCreate = {
    userId: 'user-1',
    brand: 'Citroën',
    model: 'C3',
    year: 2013,
    licensePlate: 'LOX-3345',
    chassis: '5JVLJR8JGRM9M4703',
    color: 'branco',
    fuelType: FuelType.GASOLINE,
    purchasePrice: 30_000,
    purchaseDate: new Date('2026-04-22'),
    salePrice: 50_000,
    status: VehicleStatus.AVAILABLE,
  };

  it('create persiste updatedAt e tenantId (evita NOT NULL no Supabase)', async () => {
    const insertVehicle = jest.fn().mockImplementation((payload: Record<string, unknown>) =>
      Promise.resolve({ ...payload, id: 'veh-new' }),
    );
    const mockRepo: Partial<VehicleRepository> = {
      findDuplicatePlateOrChassis: jest.fn().mockResolvedValue(null),
      insertVehicle,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesApplicationService,
        {
          provide: TenantResolutionService,
          useValue: { getTenantIdByUserIdOrThrow: jest.fn().mockResolvedValue('ten-1') },
        },
        { provide: VehicleRepository, useValue: mockRepo },
        {
          provide: CacheService,
          useValue: { clearUserCache: jest.fn(), getUserCache: jest.fn(), setUserCache: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(VehiclesApplicationService);
    const row = await service.create(baseCreate);
    expect(row.id).toBe('veh-new');

    const call = insertVehicle.mock.calls[0] as [Record<string, unknown>] | undefined;
    expect(call).toBeDefined();
    const inserted = call![0];
    expect(inserted['tenantId']).toBe('ten-1');
    expect(inserted['userId']).toBe('user-1');
    expect(inserted['brand']).toBe('Citroën');
    expect(typeof inserted['updatedAt']).toBe('string');
    expect(inserted['createdBy']).toBe('user-1');
    const payload = inserted as { updatedAt: string };
    expect(payload.updatedAt).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('create falha com placa duplicada no tenant', async () => {
    const mockRepo: Partial<VehicleRepository> = {
      findDuplicatePlateOrChassis: jest.fn().mockResolvedValue({
        licensePlate: 'LOX-3345',
        chassis: 'OTHER',
        brand: 'X',
        model: 'Y',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesApplicationService,
        {
          provide: TenantResolutionService,
          useValue: { getTenantIdByUserIdOrThrow: jest.fn().mockResolvedValue('ten-1') },
        },
        { provide: VehicleRepository, useValue: mockRepo },
        {
          provide: CacheService,
          useValue: { clearUserCache: jest.fn(), getUserCache: jest.fn(), setUserCache: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(VehiclesApplicationService);
    await expect(service.create(baseCreate)).rejects.toThrow(/placa/i);
  });
});
