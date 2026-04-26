import type { PaymentStatus, TransactionType } from '../../../database/domain.enums';

/** Porta de leitura agregada do dashboard (DDD). */
export abstract class DashboardRepository {
  abstract listVehicleIdsByTenant(tenantId: string): Promise<string[]>;

  abstract countVehicles(tenantId: string, match: Record<string, unknown>): Promise<number>;

  abstract countActiveClients(tenantId: string): Promise<number>;

  abstract listTransactionsForVehicles(
    vehicleIds: string[],
  ): Promise<
    Array<{
      type: TransactionType;
      status: PaymentStatus;
      amount: number;
      createdAt: string;
      vehicleId: string;
    }>
  >;

  abstract sumCompletedMaintenanceCosts(vehicleIds: string[]): Promise<Array<{ cost: number }>>;

  abstract listContractTransactionIds(tenantId: string): Promise<string[]>;

  abstract countTransactionsMatching(
    transactionIds: string[],
    vehicleIds: string[],
  ): Promise<number>;

  abstract listVehiclesBriefByTenant(
    tenantId: string,
  ): Promise<Array<{ id: string; brand: string; model: string; year: number }>>;
}
