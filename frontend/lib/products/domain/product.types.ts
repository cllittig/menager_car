export type StockMovementType = 'IN' | 'OUT' | 'ADJUST';

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  unit: string;
  quantityOnHand: number;
  minStock: number;
  categoryId?: string | null;
  supplierId?: string | null;
  Category?: { id: string; name: string };
  Supplier?: { id: string; name: string };
}
