export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cnh: string;
  address: string;
  birthDate?: Date;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
}

export interface ClientStats {
  totalClients: number;
  newClientsThisMonth: number;
  activeContracts: number;
  totalSales: number;
}
