import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TenantResolutionService } from '../../core/application/tenant-resolution.service';
import { VehicleStatus } from '../../database/domain.enums';
import { VehicleRow } from '../../database/vehicle.types';
import { CacheService } from '../../shared/services/cache.service';
import { VehicleRepository } from '../domain/repositories/vehicle.repository';
import {
  IVehicleCreate,
  IVehicleQuery,
  IVehicleStats,
  IVehicleUpdate,
  VehicleWithRelations,
} from '../interfaces/vehicle.interface';

/**
 * Camada de aplicação do contexto Veículos: orquestra domínio e persistência (DDD).
 */
@Injectable()
export class VehiclesApplicationService {
  constructor(
    private readonly tenantResolution: TenantResolutionService,
    private readonly vehicleRepository: VehicleRepository,
    private readonly cacheService: CacheService,
  ) {}

  async create(data: IVehicleCreate): Promise<VehicleRow> {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(data.userId);
    const existing = await this.vehicleRepository.findDuplicatePlateOrChassis(
      tenantId,
      data.licensePlate,
      data.chassis,
    );

    if (existing) {
      if (existing.licensePlate === data.licensePlate) {
        throw new Error(
          `Esta placa "${data.licensePlate}" já está cadastrada para o veículo ${existing.brand} ${existing.model} em sua conta`,
        );
      }
      if (existing.chassis === data.chassis) {
        throw new Error(
          `Este chassi "${data.chassis}" já está cadastrado para o veículo ${existing.brand} ${existing.model} em sua conta`,
        );
      }
    }

    const now = new Date().toISOString();
    const insertPayload = {
      id: randomUUID(),
      userId: data.userId,
      tenantId,
      brand: data.brand,
      model: data.model,
      year: data.year,
      licensePlate: data.licensePlate,
      chassis: data.chassis,
      mileage: data.mileage ?? 0,
      color: data.color,
      fuelType: data.fuelType,
      status: data.status ?? VehicleStatus.AVAILABLE,
      purchasePrice: data.purchasePrice,
      purchaseDate: (data.purchaseDate ?? new Date()).toISOString(),
      salePrice: data.salePrice ?? null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      updatedAt: now,
      createdBy: data.userId,
    };

    const created = await this.vehicleRepository.insertVehicle(insertPayload);
    await this.cacheService.clearUserCache(data.userId);
    return created;
  }

  async findAll(params: IVehicleQuery): Promise<VehicleRow[]> {
    const { userId, skip, take, status, search } = params;
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);

    const cacheKey = `vehicles:${userId}:${JSON.stringify({ skip, take, status, search })}`;
    const cached = await this.cacheService.getUserCache<VehicleRow[]>(userId, cacheKey);
    if (cached) {
      return cached;
    }

    const list = await this.vehicleRepository.listVehicles({
      tenantId,
      skip,
      take,
      status,
      search,
    });

    await this.cacheService.setUserCache(userId, cacheKey, list, 300);
    return list;
  }

  async findOne(id: string, userId: string): Promise<VehicleWithRelations> {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const row = await this.vehicleRepository.findOneWithRelations(id, tenantId);
    if (!row) {
      throw new NotFoundException(`Veículo com ID ${id} não encontrado`);
    }
    return row;
  }

  async update(id: string, userId: string, data: IVehicleUpdate): Promise<VehicleRow> {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const exists = await this.vehicleRepository.existsActiveVehicle(id, tenantId);
    if (!exists) {
      throw new NotFoundException(`Veículo com ID ${id} não encontrado`);
    }

    if (data.licensePlate || data.chassis) {
      const dup = await this.vehicleRepository.findDuplicateForUpdate(
        tenantId,
        id,
        data.licensePlate,
        data.chassis,
      );
      if (dup) {
        if (data.licensePlate && dup.licensePlate === data.licensePlate) {
          throw new Error('Esta placa já está cadastrada para outro veículo ativo em sua conta');
        }
        if (data.chassis && dup.chassis === data.chassis) {
          throw new Error('Este chassi já está cadastrado para outro veículo ativo em sua conta');
        }
      }
    }

    const patch: Record<string, unknown> = {
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };
    const scalarKeys: (keyof IVehicleUpdate)[] = [
      'brand',
      'model',
      'year',
      'licensePlate',
      'chassis',
      'mileage',
      'color',
      'fuelType',
      'status',
      'purchasePrice',
      'salePrice',
      'isActive',
    ];
    for (const k of scalarKeys) {
      if (data[k] !== undefined) patch[k] = data[k];
    }
    if (data.purchaseDate !== undefined) patch.purchaseDate = data.purchaseDate.toISOString();
    if (data.saleDate !== undefined) patch.saleDate = data.saleDate.toISOString();

    const updated = await this.vehicleRepository.updateVehicle(id, patch);
    await this.cacheService.clearUserCache(userId);
    return updated;
  }

  async remove(id: string, userId: string): Promise<VehicleRow> {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const exists = await this.vehicleRepository.existsActiveVehicle(id, tenantId);
    if (!exists) {
      throw new NotFoundException(`Veículo com ID ${id} não encontrado`);
    }

    const txIds = await this.vehicleRepository.listTransactionIdsForVehicle(id, tenantId);
    if (txIds.length > 0) {
      const hasContract = await this.vehicleRepository.hasContractForTransactionIds(tenantId, txIds);
      if (hasContract) {
        throw new ConflictException(
          'Não é possível remover veículo com contrato associado a uma transação.',
        );
      }
    }

    const deleted = await this.vehicleRepository.softDeleteVehicle(id, userId);
    await this.cacheService.clearUserCache(userId);
    return deleted;
  }

  async getVehicleStats(userId: string): Promise<IVehicleStats> {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const cached = await this.cacheService.getUserCache<IVehicleStats>(userId, 'stats');
    if (cached) {
      return cached;
    }

    const stats = await this.vehicleRepository.getStatsCounts(tenantId);
    await this.cacheService.setUserCache(userId, 'stats', stats, 600);
    return stats;
  }
}
