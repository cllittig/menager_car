/** Espelha enums do schema PostgreSQL. */

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  /** Funcionário — mesmo conjunto de rotas operacionais que USER; distinção por política de negócio. */
  EMPLOYEE = 'EMPLOYEE',
}

export enum FuelType {
  GASOLINE = 'GASOLINE',
  ETHANOL = 'ETHANOL',
  DIESEL = 'DIESEL',
  FLEX = 'FLEX',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
}

export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED',
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TransactionType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST',
}
