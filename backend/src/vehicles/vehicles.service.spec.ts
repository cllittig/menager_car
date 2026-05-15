import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantResolutionService } from '../core/application/tenant-resolution.service';
import { FuelType, VehicleStatus } from '../database/domain.enums';
import { CacheService } from '../shared/services/cache.service';
import { VehiclesApplicationService } from './application/vehicles.application-service';
import { VehicleRepository } from './domain/repositories/vehicle.repository';
import { VehiclesService } from './vehicles.service';

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

const vehicleRow = {
  id: 'veh-1',
  brand: 'Citroën',
  model: 'C3',
  tenantId: 'ten-1',
  userId: 'user-1',
  status: VehicleStatus.AVAILABLE,
  isActive: true,
};

async function buildModule(repoOverrides: Partial<InstanceType<typeof VehicleRepository>> = {}) {
  const defaultRepo: Partial<InstanceType<typeof VehicleRepository>> = {
    findDuplicatePlateOrChassis: jest.fn().mockResolvedValue(null),
    insertVehicle: jest.fn().mockResolvedValue({ ...vehicleRow, id: 'veh-new' }),
    listVehicles: jest.fn().mockResolvedValue([vehicleRow]),
    findOneWithRelations: jest.fn().mockResolvedValue({ ...vehicleRow, Maintenance: [] }),
    existsActiveVehicle: jest.fn().mockResolvedValue(true),
    findDuplicateForUpdate: jest.fn().mockResolvedValue(null),
    updateVehicle: jest.fn().mockResolvedValue({ ...vehicleRow }),
    listTransactionIdsForVehicle: jest.fn().mockResolvedValue([]),
    hasContractForTransactionIds: jest.fn().mockResolvedValue(false),
    softDeleteVehicle: jest.fn().mockResolvedValue({ ...vehicleRow }),
    getStatsCounts: jest.fn().mockResolvedValue({ available: 3, sold: 1, maintenance: 0, total: 4 }),
    ...repoOverrides,
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      VehiclesApplicationService,
      {
        provide: TenantResolutionService,
        useValue: { getTenantIdByUserIdOrThrow: jest.fn().mockResolvedValue('ten-1') },
      },
      { provide: VehicleRepository, useValue: defaultRepo },
      {
        provide: CacheService,
        useValue: {
          clearUserCache: jest.fn(),
          getUserCache: jest.fn().mockResolvedValue(null),
          setUserCache: jest.fn(),
        },
      },
    ],
  }).compile();

  return {
    service: module.get<VehiclesApplicationService>(VehiclesApplicationService),
    repo: module.get(VehicleRepository),
    cache: module.get(CacheService),
  };
}

describe('VehiclesService (escopo: Veículos / Dashboard estoque)', () => {
  describe('create', () => {
    it('persiste updatedAt, tenantId e createdBy ao criar veículo', async () => {
      const insertVehicle = jest.fn().mockImplementation((payload: Record<string, unknown>) =>
        Promise.resolve({ ...payload, id: 'veh-new' }),
      );
      const { service } = await buildModule({ insertVehicle });

      const row = await service.create(baseCreate);
      expect(row.id).toBe('veh-new');

      const call = insertVehicle.mock.calls[0] as [Record<string, unknown>];
      expect(call[0]['tenantId']).toBe('ten-1');
      expect(call[0]['userId']).toBe('user-1');
      expect(call[0]['brand']).toBe('Citroën');
      expect(typeof call[0]['updatedAt']).toBe('string');
      expect((call[0]['updatedAt'] as string)).toMatch(/\d{4}-\d{2}-\d{2}T/);
      expect(call[0]['createdBy']).toBe('user-1');
    });

    it('lança erro quando placa já está cadastrada no tenant', async () => {
      const { service } = await buildModule({
        findDuplicatePlateOrChassis: jest.fn().mockResolvedValue({
          licensePlate: 'LOX-3345',
          chassis: 'OUTRO',
          brand: 'Fiat',
          model: 'Uno',
        }),
      });

      await expect(service.create(baseCreate)).rejects.toThrow(/placa/i);
    });

    it('lança erro quando chassi já está cadastrado no tenant', async () => {
      const { service } = await buildModule({
        findDuplicatePlateOrChassis: jest.fn().mockResolvedValue({
          licensePlate: 'OUTRA',
          chassis: '5JVLJR8JGRM9M4703',
          brand: 'VW',
          model: 'Gol',
        }),
      });

      await expect(service.create(baseCreate)).rejects.toThrow(/chassi/i);
    });

    it('usa status AVAILABLE como padrão quando não fornecido', async () => {
      const insertVehicle = jest.fn().mockImplementation((p: Record<string, unknown>) =>
        Promise.resolve({ ...p, id: 'veh-x' }),
      );
      const { service } = await buildModule({ insertVehicle });
      const { status: _s, ...withoutStatus } = baseCreate;
      await service.create({ ...withoutStatus });

      const call = insertVehicle.mock.calls[0] as [Record<string, unknown>];
      expect(call[0]['status']).toBe(VehicleStatus.AVAILABLE);
    });

    it('limpa cache do usuário após criar veículo', async () => {
      const { service, cache } = await buildModule();
      await service.create(baseCreate);
      expect(cache.clearUserCache).toHaveBeenCalledWith('user-1');
    });
  });

  describe('findAll', () => {
    it('retorna lista de veículos do tenant', async () => {
      const { service } = await buildModule();
      const result = await service.findAll({ userId: 'user-1', skip: 0, take: 10 });
      expect(result).toHaveLength(1);
      expect(result[0].brand).toBe('Citroën');
    });

    it('retorna cache quando disponível sem consultar repositório', async () => {
      const listVehicles = jest.fn();
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          VehiclesApplicationService,
          {
            provide: TenantResolutionService,
            useValue: { getTenantIdByUserIdOrThrow: jest.fn().mockResolvedValue('ten-1') },
          },
          { provide: VehicleRepository, useValue: { listVehicles } },
          {
            provide: CacheService,
            useValue: {
              clearUserCache: jest.fn(),
              getUserCache: jest.fn().mockResolvedValue([vehicleRow]),
              setUserCache: jest.fn(),
            },
          },
        ],
      }).compile();

      const service = module.get(VehiclesApplicationService);
      const result = await service.findAll({ userId: 'user-1', skip: 0, take: 10 });

      expect(result).toHaveLength(1);
      expect(listVehicles).not.toHaveBeenCalled();
    });

    it('armazena resultado em cache após consulta ao banco', async () => {
      const { service, cache } = await buildModule();
      await service.findAll({ userId: 'user-1', skip: 0, take: 10 });
      expect(cache.setUserCache).toHaveBeenCalledWith('user-1', expect.any(String), expect.any(Array), 300);
    });
  });

  describe('findOne', () => {
    it('retorna veículo com relações quando encontrado', async () => {
      const { service } = await buildModule();
      const result = await service.findOne('veh-1', 'user-1');
      expect(result.id).toBe('veh-1');
    });

    it('lança NotFoundException quando veículo não existe no tenant', async () => {
      const { service } = await buildModule({
        findOneWithRelations: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('inexistente', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('atualiza veículo e limpa cache', async () => {
      const { service, cache } = await buildModule();
      const result = await service.update('veh-1', 'user-1', { brand: 'Ford' });
      expect(result).toBeDefined();
      expect(cache.clearUserCache).toHaveBeenCalledWith('user-1');
    });

    it('lança NotFoundException quando veículo não existe', async () => {
      const { service } = await buildModule({
        existsActiveVehicle: jest.fn().mockResolvedValue(false),
      });

      await expect(service.update('veh-x', 'user-1', { brand: 'Ford' })).rejects.toThrow(NotFoundException);
    });

    it('lança erro quando nova placa já pertence a outro veículo', async () => {
      const { service } = await buildModule({
        findDuplicateForUpdate: jest.fn().mockResolvedValue({
          licensePlate: 'ABC-1234',
          chassis: 'OUTRO',
        }),
      });

      await expect(
        service.update('veh-1', 'user-1', { licensePlate: 'ABC-1234' }),
      ).rejects.toThrow(/placa/i);
    });
  });

  describe('remove', () => {
    it('remove (soft delete) veículo sem contrato associado', async () => {
      const { service } = await buildModule();
      const result = await service.remove('veh-1', 'user-1');
      expect(result.id).toBe('veh-1');
    });

    it('lança NotFoundException quando veículo não existe', async () => {
      const { service } = await buildModule({
        existsActiveVehicle: jest.fn().mockResolvedValue(false),
      });

      await expect(service.remove('veh-x', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('lança ConflictException quando veículo tem contrato associado', async () => {
      const { service } = await buildModule({
        listTransactionIdsForVehicle: jest.fn().mockResolvedValue(['tx-1']),
        hasContractForTransactionIds: jest.fn().mockResolvedValue(true),
      });

      await expect(service.remove('veh-1', 'user-1')).rejects.toThrow(ConflictException);
    });

    it('permite remoção quando veículo tem transações mas sem contratos', async () => {
      const { service } = await buildModule({
        listTransactionIdsForVehicle: jest.fn().mockResolvedValue(['tx-1']),
        hasContractForTransactionIds: jest.fn().mockResolvedValue(false),
      });

      await expect(service.remove('veh-1', 'user-1')).resolves.toBeDefined();
    });
  });

  describe('getVehicleStats', () => {
    it('retorna estatísticas do tenant', async () => {
      const { service } = await buildModule();
      const stats = await service.getVehicleStats('user-1');
      expect(stats).toMatchObject({ available: 3, sold: 1, total: 4 });
    });

    it('retorna cache quando disponível', async () => {
      const getStatsCounts = jest.fn();
      const cachedStats = { available: 5, sold: 2, maintenance: 1, total: 8 };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          VehiclesApplicationService,
          {
            provide: TenantResolutionService,
            useValue: { getTenantIdByUserIdOrThrow: jest.fn().mockResolvedValue('ten-1') },
          },
          { provide: VehicleRepository, useValue: { getStatsCounts } },
          {
            provide: CacheService,
            useValue: {
              clearUserCache: jest.fn(),
              getUserCache: jest.fn().mockResolvedValue(cachedStats),
              setUserCache: jest.fn(),
            },
          },
        ],
      }).compile();

      const service = module.get(VehiclesApplicationService);
      const result = await service.getVehicleStats('user-1');

      expect(result).toEqual(cachedStats);
      expect(getStatsCounts).not.toHaveBeenCalled();
    });
  });
});
