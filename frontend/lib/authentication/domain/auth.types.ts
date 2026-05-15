export interface LoginDto {
  email: string;
  senha: string;
}

export interface AuthResponse {
  statusCode: number;
  code?: number;
  message: string;
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: unknown;
}
