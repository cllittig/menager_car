/** Nomes das tabelas no Postgres (identificadores com maiúsculas, como no schema). */

export const DbTable = {
  User: 'User',
  Tenant: 'Tenant',
  Vehicle: 'Vehicle',
  Client: 'Client',
  Maintenance: 'Maintenance',
  ServiceOrder: 'ServiceOrder',
  Contract: 'Contract',
  Transaction: 'Transaction',
  Installment: 'Installment',
  AuditLog: 'AuditLog',
  Category: 'Category',
  Supplier: 'Supplier',
  Product: 'Product',
  StockMovement: 'StockMovement',
  PasswordReset: 'PasswordReset',
  RefreshSession: 'RefreshSession',
  ReportSnapshot: 'ReportSnapshot',
  ReportSchedule: 'ReportSchedule',
} as const;
