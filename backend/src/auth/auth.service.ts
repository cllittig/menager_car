import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsuarioService } from '../usuario/usuario.service';
import { LoginDto } from './dto/login.dto';
import { AuthPasswordService } from './auth-password.service';
import { AuthSessionService, RefreshMeta, RefreshSessionRow } from './auth-session.service';

@Injectable()
export class AuthService {
    private readonly MAX_LOGIN_ATTEMPTS = 30;
    private readonly LOCKOUT_TIME = 15 * 60 * 1000;

    constructor(
        private readonly usuarioService: UsuarioService,
        private readonly jwtService: JwtService,
        private readonly authSession: AuthSessionService,
        private readonly authPassword: AuthPasswordService,
    ) {}

    private signAccessToken(payload: {
        email: string;
        sub: string;
        name: string;
        role: string;
        tenantId: string;
    }): string {
        return this.jwtService.sign(payload);
    }

    async login(loginDto: LoginDto, meta?: RefreshMeta) {
        const usuario = await this.usuarioService.findByEmail(loginDto.email);

        if (!usuario) throw new UnauthorizedException('Credenciais inválidas');
        if (!usuario.isActive) throw new UnauthorizedException('Usuário inativo');

        const validaSenha = await bcrypt.compare(loginDto.senha, usuario.password);
        if (!validaSenha) {
            await this.usuarioService.recordFailedLogin(loginDto.email);
            throw new UnauthorizedException('Credenciais inválidas');
        }

        const lastAttemptMs = usuario.lastLoginAttempt
            ? new Date(usuario.lastLoginAttempt as unknown as string).getTime()
            : 0;
        if (
            usuario.loginAttempts >= this.MAX_LOGIN_ATTEMPTS &&
            usuario.lastLoginAttempt &&
            Date.now() - lastAttemptMs < this.LOCKOUT_TIME
        ) {
            throw new UnauthorizedException('Conta bloqueada temporariamente');
        }

        const payload = {
            email: usuario.email,
            sub: usuario.id,
            name: usuario.name,
            role: usuario.role,
            tenantId: usuario.tenantId,
        };

        const accessToken = this.signAccessToken(payload);
        await this.authSession.revokeAllRefreshSessionsForUser(usuario.id);
        // Reset de tentativas e criação do refresh token em paralelo reduz 1 ida à rede.
        const [, { refreshToken }] = await Promise.all([
            this.usuarioService.resetLoginAttempts(usuario.id),
            this.authSession.createRefreshTokenPair(usuario.id, meta),
        ]);
        const expiresIn = this.authSession.getAccessTtlSeconds();

        return {
            statusCode: 200,
            message: 'Login realizado com sucesso',
            token: accessToken,
            accessToken,
            refreshToken,
            expiresIn,
            user: {
                id: usuario.id,
                email: usuario.email,
                name: usuario.name,
                role: usuario.role,
                tenantId: usuario.tenantId,
            },
        };
    }

    async refresh(
        refreshTokenRaw: string | undefined,
        meta?: RefreshMeta,
    ): Promise<{
        token: string;
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }> {
        if (!refreshTokenRaw?.trim()) {
            throw new UnauthorizedException('Refresh token ausente');
        }

        const tokenHash = this.authSession.hashRefresh(refreshTokenRaw);
        const row: RefreshSessionRow | null = await this.authSession.findRefreshSession(tokenHash);
        if (!row) throw new UnauthorizedException('Sessão inválida');

        if (row.revokedAt) throw new UnauthorizedException('Sessão revogada');

        if (row.replacedBySessionId) {
            await this.authSession.revokeRefreshFamily(row.familyId);
            throw new UnauthorizedException('Sessão inválida');
        }

        if (new Date(row.expiresAt).getTime() < Date.now()) {
            throw new UnauthorizedException('Sessão expirada');
        }

        const user = await this.usuarioService.findOne(row.userId);
        if (!user) {
            await this.authSession.revokeRefreshFamily(row.familyId);
            throw new UnauthorizedException('Usuário não encontrado');
        }
        if (!user.isActive) {
            await this.authSession.revokeRefreshFamily(row.familyId);
            throw new UnauthorizedException('Usuário inativo');
        }

        const payload = {
            email: user.email,
            sub: user.id,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
        };

        const { newRaw } = await this.authSession.rotateRefreshToken(
            row.id, row.familyId, row.userId, meta,
        );
        const accessToken = this.signAccessToken(payload);
        const expiresIn = this.authSession.getAccessTtlSeconds();

        return { token: accessToken, accessToken, refreshToken: newRaw, expiresIn };
    }

    async logoutRefresh(refreshTokenRaw?: string): Promise<{
        statusCode: number;
        message: string;
    }> {
        if (!refreshTokenRaw?.trim()) {
            return { statusCode: 200, message: 'Logout registrado' };
        }
        await this.authSession.revokeByTokenHash(
            this.authSession.hashRefresh(refreshTokenRaw),
        );
        return { statusCode: 200, message: 'Logout registrado' };
    }

    async getCurrentUser(userId: string) {
        const usuario = await this.usuarioService.findOne(userId);

        if (!usuario) throw new UnauthorizedException('Usuário não encontrado');
        if (!usuario.isActive) throw new UnauthorizedException('Usuário inativo');

        return {
            statusCode: 200,
            message: 'Dados do usuário obtidos com sucesso',
            user: {
                id: usuario.id,
                email: usuario.email,
                name: usuario.name,
                role: usuario.role,
                tenantId: usuario.tenantId,
                isActive: usuario.isActive,
            },
        };
    }

    async validateUser(email: string, password: string): Promise<any> {
        const usuario = await this.usuarioService.findByEmail(email);

        if (!usuario) throw new UnauthorizedException('Credenciais inválidas');
        if (!usuario.isActive) throw new UnauthorizedException('Usuário inativo');

        const isPasswordValid = await bcrypt.compare(password, usuario.password);
        if (!isPasswordValid) {
            await this.usuarioService.recordFailedLogin(email);
            throw new UnauthorizedException('Credenciais inválidas');
        }

        const { password: passwordHash, ...result } = usuario;
        void passwordHash;
        return result;
    }

    requestPasswordReset(emailRaw: string, clientOriginRaw?: string) {
        return this.authPassword.requestPasswordReset(emailRaw, clientOriginRaw);
    }

    syncPasswordAfterSupabaseRecovery(accessToken: string, plainPassword: string) {
        return this.authPassword.syncPasswordAfterSupabaseRecovery(accessToken, plainPassword);
    }

    resetPasswordWithToken(token: string, newPassword: string) {
        return this.authPassword.resetPasswordWithToken(token, newPassword);
    }
}
