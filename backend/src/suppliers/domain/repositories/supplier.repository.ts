/** Porta de persistência do contexto Fornecedores (DDD). */
export abstract class SupplierRepository {
  abstract insert(row: Record<string, unknown>): Promise<unknown>;

  abstract listAll(tenantId: string): Promise<unknown[]>;

  abstract findById(id: string, tenantId: string): Promise<unknown>;

  abstract update(
    id: string,
    tenantId: string,
    patch: Record<string, unknown>,
  ): Promise<unknown>;

  abstract delete(id: string, tenantId: string): Promise<{ id?: string }>;
}
