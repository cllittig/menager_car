export interface Contract {
  id: string;
  transactionId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadDate: string;
  transactionType: 'PURCHASE' | 'SALE' | 'MAINTENANCE';
  transactionAmount: number;
  createdAt: string;
  updatedAt: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  clientName?: string;
}

export interface CreateContractDto {
  transactionId: string;
  file: File;
  transactionType: 'PURCHASE' | 'SALE' | 'MAINTENANCE';
  transactionAmount: number;
}

export interface AvailableTransaction {
  id: string;
  type: 'PURCHASE' | 'SALE' | 'MAINTENANCE';
  amount: number;
  status: string;
  createdAt: string;
  client: {
    name: string;
    email: string;
    cpf?: string | null;
  } | null;
  vehicle: {
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
  } | null;
}
