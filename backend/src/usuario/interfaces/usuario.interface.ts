export interface Usuario {
  id: string;
  tenantId: string;
  email: string;
  password: string;
  name: string;
  role: string;
  roles: string[];
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lastLoginAttempt?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  tipo?: string;
  nome?: string;
} 