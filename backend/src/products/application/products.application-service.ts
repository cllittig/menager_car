import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TenantResolutionService } from '../../core/application/tenant-resolution.service';
import { StockMovementType } from '../../database/domain.enums';
import { ProductRepository } from '../domain/repositories/product.repository';
import { CreateProductDto } from '../dto/create-product.dto';
import { AdjustStockDto, CreateStockMovementDto } from '../dto/stock-movement.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class ProductsApplicationService {
  constructor(
    private readonly tenantResolution: TenantResolutionService,
    private readonly productRepository: ProductRepository,
  ) {}

  private async assertCategoryInTenant(categoryId: string | undefined | null, tenantId: string) {
    if (!categoryId) {
      return;
    }
    const ok = await this.productRepository.categoryExistsInTenant(categoryId, tenantId);
    if (!ok) {
      throw new BadRequestException('Categoria inválida para este tenant');
    }
  }

  private async assertSupplierInTenant(supplierId: string | undefined | null, tenantId: string) {
    if (!supplierId) {
      return;
    }
    const ok = await this.productRepository.supplierExistsInTenant(supplierId, tenantId);
    if (!ok) {
      throw new BadRequestException('Fornecedor inválido para este tenant');
    }
  }

  async create(dto: CreateProductDto, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    await this.assertCategoryInTenant(dto.categoryId, tenantId);
    await this.assertSupplierInTenant(dto.supplierId, tenantId);

    const skuDup = await this.productRepository.findSkuDuplicate(tenantId, dto.sku.trim());
    if (skuDup) {
      throw new ConflictException('SKU já cadastrado');
    }

    const now = new Date().toISOString();
    const initialQty = dto.quantityOnHand ?? 0;
    const created = (await this.productRepository.insertProduct({
      id: randomUUID(),
      tenantId,
      categoryId: dto.categoryId ?? null,
      supplierId: dto.supplierId ?? null,
      name: dto.name.trim(),
      sku: dto.sku.trim(),
      unit: dto.unit?.trim() || 'UN',
      quantityOnHand: initialQty,
      minStock: dto.minStock ?? 0,
      createdAt: now,
      updatedAt: now,
    })) as { id: string };

    if (initialQty > 0) {
      await this.productRepository.insertStockMovement({
        id: randomUUID(),
        tenantId,
        productId: created.id,
        type: StockMovementType.IN,
        quantity: initialQty,
        note: 'Estoque inicial no cadastro',
        balanceAfter: initialQty,
        userId,
        createdAt: now,
      });
    }

    return created;
  }

  async findAll(userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    return this.productRepository.listProductsWithRelations(tenantId);
  }

  async findOne(id: string, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const row = await this.productRepository.findProductWithRelations(id, tenantId);
    if (!row) {
      throw new NotFoundException('Produto não encontrado');
    }
    return row;
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    await this.findOne(id, userId);
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    if (dto.categoryId !== undefined) {
      await this.assertCategoryInTenant(dto.categoryId, tenantId);
    }
    if (dto.supplierId !== undefined) {
      await this.assertSupplierInTenant(dto.supplierId, tenantId);
    }

    if (dto.sku !== undefined) {
      const skuDup = await this.productRepository.findSkuDuplicate(
        tenantId,
        dto.sku.trim(),
        id,
      );
      if (skuDup) {
        throw new ConflictException('SKU já cadastrado');
      }
    }

    const payload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (dto.name !== undefined) {
      payload.name = dto.name.trim();
    }
    if (dto.sku !== undefined) {
      payload.sku = dto.sku.trim();
    }
    if (dto.unit !== undefined) {
      payload.unit = dto.unit.trim();
    }
    if (dto.minStock !== undefined) {
      payload.minStock = dto.minStock;
    }
    if (dto.categoryId !== undefined) {
      payload.categoryId = dto.categoryId;
    }
    if (dto.supplierId !== undefined) {
      payload.supplierId = dto.supplierId;
    }

    return this.productRepository.updateProduct(id, tenantId, payload);
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const del = await this.productRepository.deleteProduct(id, tenantId);
    if (!del.ok) {
      throw new BadRequestException(
        'Não foi possível excluir o produto (verifique movimentações vinculadas)',
      );
    }
    return { id: del.id };
  }

  async addMovement(productId: string, dto: CreateStockMovementDto, userId: string) {
    if (dto.type === StockMovementType.ADJUST) {
      throw new BadRequestException('Use o endpoint de ajuste de estoque para correções');
    }
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const prod = await this.productRepository.findProductQuantity(productId, tenantId);
    if (!prod) {
      throw new NotFoundException('Produto não encontrado');
    }

    const current = prod.quantityOnHand;
    let balanceAfter: number;
    if (dto.type === StockMovementType.IN) {
      balanceAfter = current + dto.quantity;
    } else {
      if (current < dto.quantity) {
        throw new BadRequestException('Estoque insuficiente para esta saída');
      }
      balanceAfter = current - dto.quantity;
    }

    const now = new Date().toISOString();
    const movement = await this.productRepository.insertStockMovementRow({
      id: randomUUID(),
      tenantId,
      productId,
      type: dto.type,
      quantity: dto.quantity,
      note: dto.note?.trim() ?? null,
      balanceAfter,
      userId,
      createdAt: now,
    });

    const updated = await this.productRepository.updateProductQuantity(
      productId,
      tenantId,
      balanceAfter,
      now,
    );

    return { movement, product: updated };
  }

  async adjustStock(productId: string, dto: AdjustStockDto, userId: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    const prod = await this.productRepository.findProductQuantity(productId, tenantId);
    if (!prod) {
      throw new NotFoundException('Produto não encontrado');
    }

    const current = prod.quantityOnHand;
    const newQty = dto.quantityOnHand;
    const delta = newQty - current;
    if (delta === 0) {
      return { movement: null, product: await this.findOne(productId, userId) };
    }

    const now = new Date().toISOString();
    const movement = await this.productRepository.insertStockMovementRow({
      id: randomUUID(),
      tenantId,
      productId,
      type: StockMovementType.ADJUST,
      quantity: delta,
      note: dto.note?.trim() ?? 'Ajuste de inventário',
      balanceAfter: newQty,
      userId,
      createdAt: now,
    });

    const updated = await this.productRepository.updateProductQuantity(
      productId,
      tenantId,
      newQty,
      now,
    );

    return { movement, product: updated };
  }

  async listMovements(userId: string, productId?: string) {
    const tenantId = await this.tenantResolution.getTenantIdByUserIdOrThrow(userId);
    return this.productRepository.listStockMovements(tenantId, productId);
  }
}
