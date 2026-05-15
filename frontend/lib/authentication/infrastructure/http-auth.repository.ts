import { API_ROUTES } from '@/lib/api';
import axios from '@/lib/axios';
import type { AuthResponse, LoginDto } from '../domain/auth.types';
import { AuthRepository } from '../domain/repositories/auth.repository';

function resolveLoginUrl(): string {
  if (
    typeof window !== 'undefined' &&
    process.env.NEXT_PUBLIC_AUTH_LOGIN_VIA_BFF === 'true'
  ) {
    return '/api/auth/login';
  }
  return API_ROUTES.auth.login;
}

export class HttpAuthRepository extends AuthRepository {
  postLogin(loginDto: LoginDto) {
    return axios.post<AuthResponse>(resolveLoginUrl(), loginDto, {
      withCredentials: true,
    });
  }

  postForgotPassword(email: string, clientOrigin?: string) {
    return axios.post(API_ROUTES.auth.forgotPassword, {
      email,
      ...(clientOrigin ? { clientOrigin } : {}),
    });
  }

  postResetPassword(token: string, senha: string) {
    return axios.post(API_ROUTES.auth.resetPassword, { token, senha });
  }

  postSyncPasswordFromRecovery(supabaseAccessToken: string, senha: string) {
    return axios.post<{ statusCode: number; message: string }>(
      API_ROUTES.auth.syncPasswordFromRecovery,
      { senha },
      {
        headers: { Authorization: `Bearer ${supabaseAccessToken}` },
      },
    );
  }

  postRegister(registerDto: LoginDto & { nome: string; nomeEmpresa?: string }) {
    return axios.post<Record<string, unknown>>(API_ROUTES.usuario.create, registerDto);
  }
}
