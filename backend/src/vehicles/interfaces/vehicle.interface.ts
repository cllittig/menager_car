import { FuelType, VehicleStatus } from '../../database/domain.enums';
import { VehicleRow } from '../../database/vehicle.types';

export interface IVehicleCreate {
  userId: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  chassis: string;
  mileage?: number;
  color: string;
  fuelType: FuelType;
  purchasePrice: number;
  purchaseDate?: Date;
  salePrice?: number;
  status?: VehicleStatus;
  isActive?: boolean;
}

export interface IVehicleUpdate {
  brand?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  chassis?: string;
  mileage?: number;
  color?: string;
  fuelType?: FuelType;
  status?: VehicleStatus;
  purchasePrice?: number;
  purchaseDate?: Date;
  salePrice?: number;
  saleDate?: Date;
  isActive?: boolean;
}

export interface IVehicleQuery {
  userId: string;
  skip?: number;
  take?: number;
  status?: VehicleStatus;
  search?: string;
}

export interface IVehicleStats {
  total: number;
  available: number;
  maintenance: number;
  sold: number;
  reserved: number;
}

export type VehicleWithRelations = VehicleRow & {
  Maintenance: unknown[];
  Transaction: unknown[];
};
