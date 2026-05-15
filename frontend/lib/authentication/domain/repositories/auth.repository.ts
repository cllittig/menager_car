import type { AuthResponse, LoginDto } from '../auth.types';

export abstract class AuthRepository {
  abstract postLogin(loginDto: LoginDto): Promise<{ data: AuthResponse }>;

  abstract postForgotPassword(
    email: string,
    clientOrigin?: string,
  ): Promise<{ data: { statusCode: number; message: string } }>;

  abstract postResetPassword(
    token: string,
    senha: string,
  ): Promise<{ data: { statusCode: number; message: string } }>;

  abstract postSyncPasswordFromRecovery(
    supabaseAccessToken: string,
    senha: string,
  ): Promise<{ data: { statusCode: number; message: string } }>;

  abstract postRegister(
    registerDto: LoginDto & { nome: string; nomeEmpresa?: string },
  ): Promise<{ data: Record<string, unknown> }>;
}
