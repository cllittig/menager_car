export abstract class ClientRepository {
  abstract findByCpf(tenantId: string, cpf: string): Promise<{ id: string } | null>;

  abstract findByEmail(tenantId: string, email: string): Promise<{ id: string } | null>;

  abstract insertClient(
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;

  abstract listWithTransactions(tenantId: string): Promise<Record<string, unknown>[]>;

  abstract findOneWithRelations(
    id: string,
    tenantId: string,
  ): Promise<Record<string, unknown> | null>;

  abstract findByCpfExcludingId(
    tenantId: string,
    cpf: string,
    excludeId: string,
  ): Promise<{ id: string } | null>;

  abstract findByEmailExcludingId(
    tenantId: string,
    email: string,
    excludeId: string,
  ): Promise<{ id: string } | null>;

  abstract updateClient(
    id: string,
    patch: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;

  abstract listIdsAndCreatedAt(tenantId: string): Promise<{ id: string; createdAt: string }[]>;

  abstract listWithTransactionAmounts(tenantId: string): Promise<Record<string, unknown>[]>;
}
