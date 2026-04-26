/** Porta de persistência do contexto Categorias (DDD). */
export abstract class CategoryRepository {
  abstract findByName(
    tenantId: string,
    name: string,
    excludeId?: string,
  ): Promise<{ id: string } | null>;

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
