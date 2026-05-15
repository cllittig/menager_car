export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  address?: string | null;
}
