import {
  clearClientRefreshStorage,
  clearSessionViaBff,
  getToken,
  isAuthenticated,
  removeToken,
  saveToken,
} from '@/lib/auth';
import { HttpAuthRepository } from '../infrastructure/http-auth.repository';
import type { AuthResponse, LoginDto } from '../domain/auth.types';
import { AuthRepository } from '../domain/repositories/auth.repository';

function extractMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const msg = (data as { message?: string | string[] }).message;
  if (Array.isArray(msg)) return msg.filter(Boolean).join(' ');
  if (typeof msg === 'string' && msg.length > 0) return msg;
  return fallback;
}

function registerErrorMessage(status: number, data: unknown, fallback: string): string {
  const raw = extractMessage(data, fallback);
  if (
    status === 409 &&
    typeof raw === 'string' &&
    raw.includes('duplicate key') &&
    raw.includes('unique constraint')
  ) {
    return 'Este e-mail já está cadastrado. Faça login ou use outro endereço de e-mail.';
  }
  return raw;
}

const defaultRepository = new HttpAuthRepository();

export class AuthApplicationService {
  constructor(private readonly repository: AuthRepository = defaultRepository) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      const response = await this.repository.postLogin(loginDto);

      if (!response.data) {
        throw new Error('Resposta inválida do servidor');
      }

      const access = response.data.accessToken ?? response.data.token;
      if (access) {
        saveToken(access, response.data.refreshToken);
      }
      if (process.env.NEXT_PUBLIC_AUTH_USE_HTTPONLY_REFRESH === 'true') {
        clearClientRefreshStorage();
      }

      return {
        statusCode: response.data.statusCode || 200,
        message: response.data.message || 'Login realizado com sucesso',
        token: access ?? response.data.token,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        expiresIn: response.data.expiresIn,
      };
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown }; message?: string };
      if (err.response) {
        const status = err.response.status ?? 500;
        const fromBody = err.response.data
          ? extractMessage(err.response.data, '')
          : '';
        if (status === 429) {
          return {
            statusCode: 429,
            message:
              fromBody ||
              'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
            token: undefined,
          };
        }
        if (status === 401) {
          return {
            statusCode: 401,
            message: fromBody || 'Credenciais inválidas',
            token: undefined,
          };
        }
        return {
          statusCode: status,
          message:
            fromBody ||
            (status >= 500
              ? 'Serviço temporariamente indisponível. Tente novamente em instantes.'
              : 'Não foi possível concluir o login.'),
          token: undefined,
        };
      }
      if (typeof err.message === 'string' && err.message.length > 0) {
        return {
          statusCode: 500,
          message: err.message,
          token: undefined,
        };
      }
      return {
        statusCode: 500,
        message: 'Não foi possível conectar. Verifique sua internet e tente novamente.',
        token: undefined,
      };
    }
  }

  async requestPasswordReset(email: string): Promise<{ statusCode: number; message: string }> {
    try {
      const clientOrigin =
        typeof window !== 'undefined' ? window.location.origin : undefined;
      const response = await this.repository.postForgotPassword(email, clientOrigin);
      return response.data as { statusCode: number; message: string };
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown }; message?: string };
      if (err.response?.data) {
        const status = err.response.status ?? 500;
        return {
          statusCode: status,
          message: extractMessage(
            err.response.data,
            status === 404
              ? 'Não encontramos uma conta com este e-mail.'
              : 'Não foi possível concluir o pedido.',
          ),
        };
      }
      return {
        statusCode: 500,
        message:
          typeof err.message === 'string' && err.message.length > 0
            ? err.message
            : 'Erro de rede. Tente novamente.',
      };
    }
  }

  async resetPassword(token: string, senha: string): Promise<{ statusCode: number; message: string }> {
    const response = await this.repository.postResetPassword(token, senha);
    return response.data as { statusCode: number; message: string };
  }

  async syncPasswordFromRecovery(
    supabaseAccessToken: string,
    senha: string,
  ): Promise<{ statusCode: number; message: string }> {
    const response = await this.repository.postSyncPasswordFromRecovery(supabaseAccessToken, senha);
    return response.data as { statusCode: number; message: string };
  }

  async register(
    registerDto: LoginDto & { nome: string; nomeEmpresa?: string },
  ): Promise<AuthResponse> {
    try {
      const response = await this.repository.postRegister(registerDto);

      if (!response.data) {
        throw new Error('Resposta inválida do servidor');
      }

      const d = response.data;
      const statusCode =
        typeof d.statusCode === 'number'
          ? d.statusCode
          : typeof d.code === 'number'
            ? d.code
            : 200;
      const message =
        typeof d.message === 'string' ? d.message : 'Usuário cadastrado com sucesso';

      return {
        statusCode,
        message,
      };
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown }; message?: string };
      if (err.response?.data) {
        const status = err.response.status ?? 400;
        return {
          statusCode: status,
          message: registerErrorMessage(
            status,
            err.response.data,
            'Não foi possível concluir o cadastro. Tente novamente.',
          ),
        };
      }
      if (typeof err.message === 'string' && err.message.length > 0) {
        return { statusCode: 500, message: err.message };
      }
      return {
        statusCode: 500,
        message: 'Erro ao cadastrar usuário. Tente novamente mais tarde.',
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await clearSessionViaBff();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  getCurrentUser() {
    const token = getToken();
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Token JWT inválido');
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));

      return {
        id: payload.sub || payload.id || payload.userId,
        email: payload.email || payload.username,
        name: payload.name || payload.nome || payload.displayName || payload.fullName,
        role: payload.role || payload.roles?.[0] || 'USER',
        tenantId: payload.tenantId as string | undefined,
      };
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  }

  isLoggedIn(): boolean {
    return isAuthenticated();
  }

  getAuthToken(): string | undefined {
    return getToken();
  }
}

export const authApplicationService = new AuthApplicationService();

export const login = authApplicationService.login.bind(authApplicationService);
export const logout = authApplicationService.logout.bind(authApplicationService);
export const getCurrentUser = authApplicationService.getCurrentUser.bind(authApplicationService);
export const isLoggedIn = authApplicationService.isLoggedIn.bind(authApplicationService);
export const getAuthToken = authApplicationService.getAuthToken.bind(authApplicationService);
