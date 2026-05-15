export interface Category {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
