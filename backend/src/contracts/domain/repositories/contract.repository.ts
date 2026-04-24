/** Porta de persistência do contexto Contratos (DDD). */
export abstract class ContractRepository {
  abstract getTransactionBasics(
    transactionId: string,
  ): Promise<{ id: string; tenantId: string } | null>;

  abstract existsForTransaction(transactionId: string): Promise<boolean>;

  abstract insertContract(row: Record<string, unknown>): Promise<Record<string, unknown>>;

  abstract getTransactionForUpload(
    transactionId: string,
  ): Promise<{
    id: string;
    tenantId: string;
    Vehicle: { licensePlate: string } | null;
  } | null>;

  abstract listIdsByFileNamePrefix(tenantId: string, prefix: string): Promise<unknown[]>;

  abstract listAllForTenantRaw(tenantId: string): Promise<unknown[]>;

  abstract findOneJoined(id: string, tenantId: string): Promise<Record<string, unknown> | null>;

  abstract updateFileMeta(
    id: string,
    tenantId: string,
    fileName: string,
    updatedAt: string,
  ): Promise<unknown>;

  abstract deleteReturning(id: string): Promise<unknown>;

  abstract listActiveTransactionIds(tenantId: string): Promise<string[]>;

  abstract listContractTransactionIds(tenantId: string): Promise<string[]>;

  abstract listTransactionsWithRelations(ids: string[]): Promise<unknown[]>;

  abstract countByTenant(tenantId: string): Promise<number>;

  abstract countByTenantSince(tenantId: string, sinceIso: string): Promise<number>;

  abstract listWithNestedTransactionType(tenantId: string): Promise<unknown[]>;

  abstract findByTransactionJoined(
    transactionId: string,
    tenantId: string,
  ): Promise<Record<string, unknown> | null>;
}
