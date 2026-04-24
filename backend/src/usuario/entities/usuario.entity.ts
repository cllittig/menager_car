export class Usuario {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'USER' | 'EMPLOYEE';
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
}
