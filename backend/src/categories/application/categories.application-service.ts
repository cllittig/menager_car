import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TenantResolutionService } from '../../core/application/tenant-resolution.service';
import { CategoryRepository } from '../domain/repositories/category.repository';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

@Injectable()
export class CategoriesApplicationService {
  constructor(
    private readonly tenantResolution: TenantResolutionService,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(dto: CreateCategoryDto, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const dup = await this.categoryRepository.findByName(tenantId, dto.name.trim());
    if (dup) {
      throw new ConflictException('Já existe uma categoria com este nome');
    }

    const now = new Date().toISOString();
    return this.categoryRepository.insert({
      id: randomUUID(),
      tenantId,
      name: dto.name.trim(),
      description: dto.description?.trim() ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  async findAll(userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    return this.categoryRepository.listAll(tenantId);
  }

  async findOne(id: string, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const row = await this.categoryRepository.findById(id, tenantId);
    if (!row) {
      throw new NotFoundException('Categoria não encontrada');
    }
    return row;
  }

  async update(id: string, dto: UpdateCategoryDto, userId: string) {
    await this.findOne(id, userId);
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    if (dto.name !== undefined) {
      const dup = await this.categoryRepository.findByName(tenantId, dto.name.trim(), id);
      if (dup) {
        throw new ConflictException('Já existe uma categoria com este nome');
      }
    }
    const payload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (dto.name !== undefined) {
      payload.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      payload.description = dto.description?.trim() ?? null;
    }

    return this.categoryRepository.update(id, tenantId, payload);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    return this.categoryRepository.delete(id, tenantId);
  }
}
