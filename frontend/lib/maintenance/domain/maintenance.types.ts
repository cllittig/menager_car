export interface Maintenance {
  id: string;
  vehicleId: string;
  description: string;
  cost: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  mechanic: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
    year: number;
  };
}

export interface CreateMaintenanceDto {
  vehicleId: string;
  description: string;
  cost: number;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  mechanic: string;
  startDate?: string;
  endDate?: string;
}
