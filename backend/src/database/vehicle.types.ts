import { FuelType, VehicleStatus } from './domain.enums';

/** Linha de veículo retornada pelo Supabase (campos principais). */
export type VehicleRow = {
  id: string;
  tenantId: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  chassis: string;
  mileage: number;
  color: string;
  fuelType: FuelType;
  status: VehicleStatus;
  purchasePrice: number;
  salePrice: number | null;
  purchaseDate: string;
  saleDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedBy?: string | null;
};
