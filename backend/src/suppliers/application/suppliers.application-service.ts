import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TenantResolutionService } from '../../core/application/tenant-resolution.service';
import { SupplierRepository } from '../domain/repositories/supplier.repository';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { UpdateSupplierDto } from '../dto/update-supplier.dto';

@Injectable()
export class SuppliersApplicationService {
  constructor(
    private readonly tenantResolution: TenantResolutionService,
    private readonly supplierRepository: SupplierRepository,
  ) {}

  async create(dto: CreateSupplierDto, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const now = new Date().toISOString();
    return this.supplierRepository.insert({
      id: randomUUID(),
      tenantId,
      name: dto.name.trim(),
      email: dto.email?.trim() ?? null,
      phone: dto.phone?.trim() ?? null,
      document: dto.document?.trim() ?? null,
      address: dto.address?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  async findAll(userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    return this.supplierRepository.listAll(tenantId);
  }

  async findOne(id: string, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const row = await this.supplierRepository.findById(id, tenantId);
    if (!row) {
      throw new NotFoundException('Fornecedor não encontrado');
    }
    return row;
  }

  async update(id: string, dto: UpdateSupplierDto, userId: string) {
    await this.findOne(id, userId);
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const payload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (dto.name !== undefined) {
      payload.name = dto.name.trim();
    }
    if (dto.email !== undefined) {
      payload.email = dto.email?.trim() ?? null;
    }
    if (dto.phone !== undefined) {
      payload.phone = dto.phone?.trim() ?? null;
    }
    if (dto.document !== undefined) {
      payload.document = dto.document?.trim() ?? null;
    }
    if (dto.address !== undefined) {
      payload.address = dto.address?.trim() ?? null;
    }

    return this.supplierRepository.update(id, tenantId, payload);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    return this.supplierRepository.delete(id, tenantId);
  }
}
