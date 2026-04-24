/** Porta de persistência do contexto Produtos / estoque (DDD). */
export abstract class ProductRepository {
  abstract categoryExistsInTenant(categoryId: string, tenantId: string): Promise<boolean>;

  abstract supplierExistsInTenant(supplierId: string, tenantId: string): Promise<boolean>;

  abstract findSkuDuplicate(
    tenantId: string,
    sku: string,
    excludeProductId?: string,
  ): Promise<boolean>;

  abstract insertProduct(row: Record<string, unknown>): Promise<unknown>;

  abstract insertStockMovement(row: Record<string, unknown>): Promise<void>;

  abstract listProductsWithRelations(tenantId: string): Promise<unknown[]>;

  abstract findProductWithRelations(id: string, tenantId: string): Promise<unknown>;

  abstract updateProduct(
    id: string,
    tenantId: string,
    patch: Record<string, unknown>,
  ): Promise<unknown>;

  abstract deleteProduct(id: string, tenantId: string): Promise<{ ok: true; id?: string } | { ok: false }>;

  abstract findProductQuantity(
    productId: string,
    tenantId: string,
  ): Promise<{ id: string; quantityOnHand: number } | null>;

  abstract insertStockMovementRow(row: Record<string, unknown>): Promise<unknown>;

  abstract updateProductQuantity(
    productId: string,
    tenantId: string,
    quantityOnHand: number,
    updatedAt: string,
  ): Promise<unknown>;

  abstract listStockMovements(tenantId: string, productId?: string): Promise<unknown[]>;
}
