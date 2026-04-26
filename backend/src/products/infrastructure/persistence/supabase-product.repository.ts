import { Injectable } from '@nestjs/common';
import { DbTable } from '../../../database/db-tables';
import { ensureNoError } from '../../../supabase/supabase-error.util';
import { SupabaseService } from '../../../supabase/supabase.service';
import { ProductRepository } from '../../domain/repositories/product.repository';

@Injectable()
export class SupabaseProductRepository extends ProductRepository {
  constructor(private readonly supabase: SupabaseService) {
    super();
  }

  private sb() {
    return this.supabase.getClient();
  }

  async categoryExistsInTenant(categoryId: string, tenantId: string): Promise<boolean> {
    const r = await this.sb()
      .from(DbTable.Category)
      .select('id')
      .eq('id', categoryId)
      .eq('tenantId', tenantId)
      .maybeSingle();
    return Boolean(r.data);
  }

  async supplierExistsInTenant(supplierId: string, tenantId: string): Promise<boolean> {
    const r = await this.sb()
      .from(DbTable.Supplier)
      .select('id')
      .eq('id', supplierId)
      .eq('tenantId', tenantId)
      .maybeSingle();
    return Boolean(r.data);
  }

  async findSkuDuplicate(
    tenantId: string,
    sku: string,
    excludeProductId?: string,
  ): Promise<boolean> {
    let q = this.sb()
      .from(DbTable.Product)
      .select('id')
      .eq('tenantId', tenantId)
      .eq('sku', sku);
    if (excludeProductId) {
      q = q.neq('id', excludeProductId);
    }
    const r = await q.maybeSingle();
    return Boolean(r.data);
  }

  async insertProduct(row: Record<string, unknown>): Promise<unknown> {
    const ins = await this.sb().from(DbTable.Product).insert(row).select('*').single();
    ensureNoError(ins.error, ins.data, 'Product.create');
    return ins.data;
  }

  async insertStockMovement(row: Record<string, unknown>): Promise<void> {
    await this.sb().from(DbTable.StockMovement).insert(row);
  }

  async listProductsWithRelations(tenantId: string): Promise<unknown[]> {
    const res = await this.sb()
      .from(DbTable.Product)
      .select(
        `*,
        Category ( id, name ),
        Supplier ( id, name )
      `,
      )
      .eq('tenantId', tenantId)
      .order('name', { ascending: true });
    ensureNoError(res.error, res.data, 'Product.findAll');
    return (res.data ?? []) as unknown[];
  }

  async findProductWithRelations(id: string, tenantId: string): Promise<unknown> {
    const res = await this.sb()
      .from(DbTable.Product)
      .select(
        `*,
        Category ( id, name ),
        Supplier ( id, name )
      `,
      )
      .eq('id', id)
      .eq('tenantId', tenantId)
      .maybeSingle();
    if (res.error || !res.data) {
      return null;
    }
    return res.data;
  }

  async updateProduct(
    id: string,
    tenantId: string,
    patch: Record<string, unknown>,
  ): Promise<unknown> {
    const res = await this.sb()
      .from(DbTable.Product)
      .update(patch)
      .eq('id', id)
      .eq('tenantId', tenantId)
      .select('*')
      .maybeSingle();
    ensureNoError(res.error, res.data, 'Product.update');
    return res.data;
  }

  async deleteProduct(
    id: string,
    tenantId: string,
  ): Promise<{ ok: true; id?: string } | { ok: false }> {
    const del = await this.sb()
      .from(DbTable.Product)
      .delete()
      .eq('id', id)
      .eq('tenantId', tenantId)
      .select('id')
      .maybeSingle();
    if (del.error) {
      return { ok: false };
    }
    return { ok: true, id: del.data?.id as string | undefined };
  }

  async findProductQuantity(
    productId: string,
    tenantId: string,
  ): Promise<{ id: string; quantityOnHand: number } | null> {
    const prod = await this.sb()
      .from(DbTable.Product)
      .select('id, quantityOnHand')
      .eq('id', productId)
      .eq('tenantId', tenantId)
      .maybeSingle();
    if (!prod.data) {
      return null;
    }
    return prod.data as { id: string; quantityOnHand: number };
  }

  async insertStockMovementRow(row: Record<string, unknown>): Promise<unknown> {
    const movIns = await this.sb().from(DbTable.StockMovement).insert(row).select('*').single();
    ensureNoError(movIns.error, movIns.data, 'StockMovement.create');
    return movIns.data;
  }

  async updateProductQuantity(
    productId: string,
    tenantId: string,
    quantityOnHand: number,
    updatedAt: string,
  ): Promise<unknown> {
    const upd = await this.sb()
      .from(DbTable.Product)
      .update({ quantityOnHand, updatedAt })
      .eq('id', productId)
      .eq('tenantId', tenantId)
      .select('*')
      .maybeSingle();
    ensureNoError(upd.error, upd.data, 'Product.updateQty');
    return upd.data;
  }

  async listStockMovements(tenantId: string, productId?: string): Promise<unknown[]> {
    let q = this.sb()
      .from(DbTable.StockMovement)
      .select(
        `*,
        Product ( id, name, sku )
      `,
      )
      .eq('tenantId', tenantId)
      .order('createdAt', { ascending: false })
      .limit(500);
    if (productId) {
      q = q.eq('productId', productId);
    }
    const res = await q;
    ensureNoError(res.error, res.data, 'StockMovement.list');
    return (res.data ?? []) as unknown[];
  }
}
