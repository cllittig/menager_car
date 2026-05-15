import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { AuthPasswordService } from './auth-password.service';
import { AuthSessionService, RefreshSessionRow } from './auth-session.service';
import { UsuarioService } from '../usuario/usuario.service';

const makeUser = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  password: '',
  name: 'Usuário Teste',
  role: 'USER',
  tenantId: 'tenant-1',
  isActive: true,
  loginAttempts: 0,
  lastLoginAttempt: null,
  ...overrides,
});

const makeSessionMock = (sessionRow?: Partial<RefreshSessionRow> | null) => ({
  hashRefresh: jest.fn().mockReturnValue('hashed-token'),
  findRefreshSession: jest.fn().mockResolvedValue(
    sessionRow !== undefined ? sessionRow : null,
  ),
  revokeRefreshFamily: jest.fn().mockResolvedValue(undefined),
  revokeByTokenHash: jest.fn().mockResolvedValue(undefined),
  revokeAllRefreshSessionsForUser: jest.fn().mockResolvedValue(undefined),
  createRefreshTokenPair: jest.fn().mockResolvedValue({
    refreshToken: 'refresh-tok',
    familyId: 'fam-1',
  }),
  rotateRefreshToken: jest.fn().mockResolvedValue({
    newRaw: 'new-refresh-tok',
    newSessionId: 'sess-new',
  }),
  getAccessTtlSeconds: jest.fn().mockReturnValue(900),
});

async function buildModule(
  userOverrides: Partial<Record<string, unknown>> = {},
  sessionOverrides: Partial<ReturnType<typeof makeSessionMock>> = {},
) {
  const userRow = makeUser(userOverrides);
  userRow.password = await bcrypt.hash('senha123', 10);

  const sessionMock = { ...makeSessionMock(), ...sessionOverrides };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AuthService,
      {
        provide: UsuarioService,
        useValue: {
          findByEmail: jest.fn().mockResolvedValue(userRow),
          findOne: jest.fn().mockResolvedValue(userRow),
          recordFailedLogin: jest.fn().mockResolvedValue(undefined),
          resetLoginAttempts: jest.fn().mockResolvedValue(undefined),
        },
      },
      {
        provide: JwtService,
        useValue: { sign: jest.fn().mockReturnValue('jwt-token') },
      },
      { provide: AuthSessionService, useValue: sessionMock },
      { provide: AuthPasswordService, useValue: {} },
    ],
  }).compile();

  return {
    service: module.get(AuthService),
    usuarioService: module.get(UsuarioService),
    authSession: module.get(AuthSessionService),
  };
}

describe('AuthService', () => {
  describe('login — fluxo completo', () => {
    it('retorna accessToken, refreshToken e dados do usuário no login bem-sucedido', async () => {
      const { service } = await buildModule();
      const result = await service.login({ email: 'test@example.com', senha: 'senha123' });

      expect(result.statusCode).toBe(200);
      expect(result.token).toBe('jwt-token');
      expect(result.accessToken).toBe('jwt-token');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.refreshToken.length).toBeGreaterThan(0);
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.tenantId).toBe('tenant-1');
    });

    it('lança UnauthorizedException quando usuário não existe', async () => {
      const { service, usuarioService } = await buildModule();
      (usuarioService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.login({ email: 'naoexiste@example.com', senha: 'senha123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('lança UnauthorizedException quando usuário está inativo', async () => {
      const { service } = await buildModule({ isActive: false });

      await expect(
        service.login({ email: 'test@example.com', senha: 'senha123' }),
      ).rejects.toThrow('Usuário inativo');
    });

    it('lança UnauthorizedException e registra tentativa quando senha está incorreta', async () => {
      const { service, usuarioService } = await buildModule();

      await expect(
        service.login({ email: 'test@example.com', senha: 'senha-errada' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(usuarioService.recordFailedLogin).toHaveBeenCalledWith('test@example.com');
    });

    it('lança UnauthorizedException quando conta está bloqueada por excesso de tentativas', async () => {
      const { service } = await buildModule({
        loginAttempts: 30,
        lastLoginAttempt: new Date().toISOString(),
      });

      await expect(
        service.login({ email: 'test@example.com', senha: 'senha123' }),
      ).rejects.toThrow('Conta bloqueada temporariamente');
    });

    it('redefine tentativas de login após autenticação bem-sucedida', async () => {
      const { service, usuarioService } = await buildModule();
      await service.login({ email: 'test@example.com', senha: 'senha123' });

      expect(usuarioService.resetLoginAttempts).toHaveBeenCalledWith('user-1');
    });
  });

  describe('login — duração do token', () => {
    it('expiresIn é número positivo', async () => {
      const { service } = await buildModule();
      const result = await service.login({ email: 'test@example.com', senha: 'senha123' });
      expect(typeof result.expiresIn).toBe('number');
      expect(result.expiresIn).toBeGreaterThan(0);
    });
  });

  describe('refresh — validação de sessão', () => {
    it('lança UnauthorizedException quando refresh token está ausente', async () => {
      const { service } = await buildModule();
      await expect(service.refresh(undefined)).rejects.toThrow('Refresh token ausente');
      await expect(service.refresh('')).rejects.toThrow('Refresh token ausente');
      await expect(service.refresh('   ')).rejects.toThrow('Refresh token ausente');
    });

    it('lança UnauthorizedException quando sessão não existe no banco', async () => {
      const { service } = await buildModule({}, {
        findRefreshSession: jest.fn().mockResolvedValue(null),
      });
      await expect(service.refresh('token-invalido')).rejects.toThrow('Sessão inválida');
    });

    it('lança UnauthorizedException quando sessão está revogada', async () => {
      const { service } = await buildModule({}, {
        findRefreshSession: jest.fn().mockResolvedValue({
          id: 's1',
          userId: 'user-1',
          familyId: 'fam-1',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          replacedBySessionId: null,
          revokedAt: new Date().toISOString(),
          tokenHash: 'hash',
        }),
      });
      await expect(service.refresh('valid-token')).rejects.toThrow('Sessão revogada');
    });

    it('lança UnauthorizedException quando sessão foi substituída (token reuse)', async () => {
      const { service } = await buildModule({}, {
        findRefreshSession: jest.fn().mockResolvedValue({
          id: 's1',
          userId: 'user-1',
          familyId: 'fam-1',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          replacedBySessionId: 's2',
          revokedAt: null,
          tokenHash: 'hash',
        }),
      });
      await expect(service.refresh('valid-token')).rejects.toThrow('Sessão inválida');
    });

    it('lança UnauthorizedException quando sessão está expirada', async () => {
      const { service } = await buildModule({}, {
        findRefreshSession: jest.fn().mockResolvedValue({
          id: 's1',
          userId: 'user-1',
          familyId: 'fam-1',
          expiresAt: new Date(Date.now() - 1000).toISOString(),
          replacedBySessionId: null,
          revokedAt: null,
          tokenHash: 'hash',
        }),
      });
      await expect(service.refresh('valid-token')).rejects.toThrow('Sessão expirada');
    });
  });
});
