export interface Sale {
  id: string;
  vehicleId: string;
  clientId: string;
  amount: number;
  saleDate: string;
  createdAt: string;
  updatedAt: string;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
    year: number;
    color?: string;
    saleDate?: string;
  };
  client: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    cpf?: string;
  };
}

export interface CreateSaleDto {
  vehicleId: string;
  clientId: string;
  amount: number;
  saleDate?: string;
}
