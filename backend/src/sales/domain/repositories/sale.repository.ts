import type { TransactionType } from '../../../database/domain.enums';

/** Porta de persistência do contexto Vendas (DDD). */
export abstract class SaleRepository {
  abstract listVehicleIdsByTenant(tenantId: string): Promise<string[]>;

  abstract findVehicleForSale(
    vehicleId: string,
    tenantId: string,
  ): Promise<{ status: string } | null>;

  abstract clientExistsInTenant(clientId: string, tenantId: string): Promise<boolean>;

  abstract insertTransaction(row: Record<string, unknown>): Promise<void>;

  abstract deleteTransaction(id: string): Promise<void>;

  abstract insertInstallments(rows: Record<string, unknown>[]): Promise<void>;

  abstract deleteInstallmentsByTransaction(transactionId: string): Promise<void>;

  abstract updateVehicleAfterSale(
    vehicleId: string,
    patch: Record<string, unknown>,
  ): Promise<void>;

  abstract fetchTransactionFull(transactionId: string): Promise<Record<string, unknown>>;

  abstract listSaleTransactionsForVehicles(vehicleIds: string[]): Promise<unknown[]>;

  abstract findTransactionSaleById(transactionId: string): Promise<Record<string, unknown> | null>;

  abstract updateTransactionRecord(
    id: string,
    patch: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;

  abstract updateTransactionSaleFields(
    id: string,
    patch: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;

  abstract findInstallmentByTxAndNumber(
    transactionId: string,
    number: number,
  ): Promise<{ id: string; status: string } | null>;

  abstract updateInstallmentPaid(
    installmentId: string,
    paidAt: string,
  ): Promise<unknown>;

  abstract listInstallmentStatuses(transactionId: string): Promise<Array<{ status: string }>>;

  abstract markTransactionPaid(id: string, userId: string): Promise<void>;

  abstract listTransactionsForStats(vehicleIds: string[]): Promise<
    Array<{
      id: string;
      amount: number;
      status: string;
      createdAt: string;
      vehicleId: string;
    }>
  >;

  abstract listVehiclesBrief(
    ids: string[],
  ): Promise<Array<{ id: string; brand: string; model: string; year: number }>>;

  abstract listPendingInstallmentsDueBefore(
    untilIso: string,
  ): Promise<
    Array<{
      dueDate: string;
      Transaction: {
        type: TransactionType;
        vehicleId: string;
        Client: unknown;
        Vehicle: unknown;
      };
    }>
  >;

  abstract softDeactivateTransaction(
    id: string,
    userId: string,
  ): Promise<{ id: string }>;

  abstract revertVehicleSaleState(
    vehicleId: string,
    userId: string,
  ): Promise<void>;

  abstract vehicleExistsInTenant(vehicleId: string, tenantId: string): Promise<boolean>;
}
