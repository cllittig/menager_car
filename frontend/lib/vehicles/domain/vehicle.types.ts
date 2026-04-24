export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  chassis: string;
  purchasePrice: number;
  salePrice?: number;
  status: 'AVAILABLE' | 'SOLD' | 'MAINTENANCE' | 'RESERVED';
  mileage?: number;
  fuelType: 'GASOLINE' | 'ETHANOL' | 'FLEX' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  purchaseDate?: Date;
  saleDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  imageUrl?: string;
}
