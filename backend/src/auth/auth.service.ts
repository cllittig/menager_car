import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { DbTable } from '../database/db-tables';
import { SupabaseService } from '../supabase/supabase.service';
import { ensureNoError } from '../supabase/supabase-error.util';
import { UsuarioService } from '../usuario/usuario.service';
import { LoginDto } from './dto/login.dto';

type RefreshMeta = { userAgent?: string; ip?: string };

type RefreshSessionRow = {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: string;
    replacedBySessionId: string | null;
    revokedAt: string | null;
};

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly MAX_LOGIN_ATTEMPTS = 30;
    private readonly LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos

    constructor(
        private readonly usuarioService: UsuarioService,
        private readonly jwtService: JwtService,
        private readonly supabase: SupabaseService,
        private readonly config: ConfigService,
    ) {}

    private sb() {
        return this.supabase.getClient();
    }

    private hashRefresh(raw: string): string {
        return createHash('sha256').update(raw).digest('hex');
    }

    private getAccessTtlSeconds(): number {
        const sec = this.config.get<string>('JWT_ACCESS_EXPIRES_SEC');
        if (sec && /^\d+$/.test(sec)) {
            return parseInt(sec, 10);
        }
        return this.parseDurationToSeconds(
            this.config.get<string>('JWT_ACCESS_EXPIRES', '15m'),
        );
    }

    private parseDurationToSeconds(value: string): number {
        const v = value.trim();
        if (/^\d+$/.test(v)) {
            return parseInt(v, 10);
        }
        const m = /^(\d+)\s*([smhd])$/i.exec(v);
        if (!m) {
            return 900;
        }
        const n = parseInt(m[1], 10);
        switch (m[2].toLowerCase()) {
            case 's':
                return n;
            case 'm':
                return n * 60;
            case 'h':
                return n * 3600;
            case 'd':
                return n * 86400;
            default:
                return 900;
        }
    }

    private getRefreshTtlMs(): number {
        const daysRaw = this.config.get<string>('JWT_REFRESH_EXPIRES_DAYS', '30');
        const days = /^\d+$/.test(daysRaw) ? parseInt(daysRaw, 10) : 30;
        return Math.max(1, days) * 24 * 60 * 60 * 1000;
    }

    private signAccessToken(payload: {
        email: string;
        sub: string;
        name: string;
        role: string;
        tenantId: string;
    }): string {
        return this.jwtService.sign(payload);
    }

    private async insertRefreshSession(params: {
        userId: string;
        familyId: string;
        tokenHash: string;
        expiresAt: Date;
        meta?: RefreshMeta;
    }): Promise<string> {
        const id = randomUUID();
        const now = new Date().toISOString();
        const ins = await this.sb()
            .from(DbTable.RefreshSession)
            .insert({
                id,
                userId: params.userId,
                tokenHash: params.tokenHash,
                familyId: params.familyId,
                expiresAt: params.expiresAt.toISOString(),
                createdAt: now,
                userAgent: params.meta?.userAgent ?? null,
                ip: params.meta?.ip ?? null,
            })
            .select('id')
            .single();
        ensureNoError(ins.error, ins.data, 'RefreshSession.create');
        return id;
    }

    private async revokeRefreshFamily(familyId: string): Promise<void> {
        const now = new Date().toISOString();
        await this.sb()
            .from(DbTable.RefreshSession)
            .update({ revokedAt: now })
            .eq('familyId', familyId)
            .is('revokedAt', null);
    }

    /** Invalida todos os refresh tokens do utilizador (novo login = uma sessão de refresh ativa). */
    private async revokeAllRefreshSessionsForUser(userId: string): Promise<void> {
        try {
            const now = new Date().toISOString();
            const res = await this.sb()
                .from(DbTable.RefreshSession)
                .update({ revokedAt: now })
                .eq('userId', userId)
                .is('revokedAt', null);
            if (res.error) {
                this.logger.warn(
                    `Não foi possível revogar sessões anteriores (login continua): ${res.error.message}`,
                );
            }
        } catch (e) {
            this.logger.warn(
                `revokeAllRefreshSessionsForUser: ${e instanceof Error ? e.message : String(e)}`,
            );
        }
    }

    private async createRefreshTokenPair(
        userId: string,
        meta?: RefreshMeta,
    ): Promise<{ refreshToken: string; familyId: string }> {
        const familyId = randomUUID();
        const raw = randomBytes(48).toString('base64url');
        const tokenHash = this.hashRefresh(raw);
        const expiresAt = new Date(Date.now() + this.getRefreshTtlMs());
        await this.insertRefreshSession({
            userId,
            familyId,
            tokenHash,
            expiresAt,
            meta,
        });
        return { refreshToken: raw, familyId };
    }

    async login(loginDto: LoginDto, meta?: RefreshMeta) {
        const usuario = await this.usuarioService.findByEmail(loginDto.email);

        if (!usuario) {
            throw new UnauthorizedException('Credenciais inválidas');
        }

        if (!usuario.isActive) {
            throw new UnauthorizedException('Usuário inativo');
        }

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
        await this.revokeAllRefreshSessionsForUser(usuario.id);
        // Resete de tentativas e persistência do refresh são independentes: executar em paralelo reduz 1 ida à rede.
        const [, { refreshToken }] = await Promise.all([
            this.usuarioService.resetLoginAttempts(usuario.id),
            this.createRefreshTokenPair(usuario.id, meta),
        ]);
        const expiresIn = this.getAccessTtlSeconds();

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

        const tokenHash = this.hashRefresh(refreshTokenRaw);
        const res = await this.sb()
            .from(DbTable.RefreshSession)
            .select(
                'id, userId, familyId, expiresAt, replacedBySessionId, revokedAt',
            )
            .eq('tokenHash', tokenHash)
            .maybeSingle();

        if (res.error || !res.data) {
            throw new UnauthorizedException('Sessão inválida');
        }

        const row = res.data as RefreshSessionRow;
        const nowMs = Date.now();

        if (row.revokedAt) {
            throw new UnauthorizedException('Sessão revogada');
        }

        if (row.replacedBySessionId) {
            await this.revokeRefreshFamily(row.familyId);
            throw new UnauthorizedException('Sessão inválida');
        }

        if (new Date(row.expiresAt).getTime() < nowMs) {
            throw new UnauthorizedException('Sessão expirada');
        }

        const user = await this.usuarioService.findOne(row.userId);
        if (!user) {
            await this.revokeRefreshFamily(row.familyId);
            throw new UnauthorizedException('Usuário não encontrado');
        }
        if (!user.isActive) {
            await this.revokeRefreshFamily(row.familyId);
            throw new UnauthorizedException('Usuário inativo');
        }

        const payload = {
            email: user.email,
            sub: user.id,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
        };

        const newRaw = randomBytes(48).toString('base64url');
        const newHash = this.hashRefresh(newRaw);
        const expiresAt = new Date(Date.now() + this.getRefreshTtlMs());
        const newSessionId = randomUUID();
        const nowIso = new Date().toISOString();

        const ins = await this.sb()
            .from(DbTable.RefreshSession)
            .insert({
                id: newSessionId,
                userId: row.userId,
                tokenHash: newHash,
                familyId: row.familyId,
                expiresAt: expiresAt.toISOString(),
                createdAt: nowIso,
                userAgent: meta?.userAgent ?? null,
                ip: meta?.ip ?? null,
            })
            .select('id')
            .single();
        ensureNoError(ins.error, ins.data, 'RefreshSession.rotateInsert');

        const upd = await this.sb()
            .from(DbTable.RefreshSession)
            .update({ replacedBySessionId: newSessionId })
            .eq('id', row.id)
            .is('replacedBySessionId', null);
        ensureNoError(upd.error, upd.data, 'RefreshSession.rotateMarkOld');

        const accessToken = this.signAccessToken(payload);
        const expiresIn = this.getAccessTtlSeconds();

        return {
            token: accessToken,
            accessToken,
            refreshToken: newRaw,
            expiresIn,
        };
    }

    async logoutRefresh(refreshTokenRaw?: string): Promise<{
        statusCode: number;
        message: string;
    }> {
        if (!refreshTokenRaw?.trim()) {
            return { statusCode: 200, message: 'Logout registrado' };
        }
        const tokenHash = this.hashRefresh(refreshTokenRaw);
        const now = new Date().toISOString();
        const upd = await this.sb()
            .from(DbTable.RefreshSession)
            .update({ revokedAt: now })
            .eq('tokenHash', tokenHash)
            .is('revokedAt', null);
        ensureNoError(upd.error, upd.data, 'RefreshSession.revoke');
        return { statusCode: 200, message: 'Logout registrado' };
    }

    async getCurrentUser(userId: string) {
        const usuario = await this.usuarioService.findOne(userId);

        if (!usuario) {
            throw new UnauthorizedException('Usuário não encontrado');
        }

        if (!usuario.isActive) {
            throw new UnauthorizedException('Usuário inativo');
        }

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

        if (!usuario) {
            throw new UnauthorizedException('Credenciais inválidas');
        }

        if (!usuario.isActive) {
            throw new UnauthorizedException('Usuário inativo');
        }

        const isPasswordValid = await bcrypt.compare(password, usuario.password);

        if (!isPasswordValid) {
            await this.usuarioService.recordFailedLogin(email);
            throw new UnauthorizedException('Credenciais inválidas');
        }

        const { password: passwordHash, ...result } = usuario;
        void passwordHash;
        return result;
    }

    /**
     * Envia e-mail de recuperação via Supabase Auth (GoTrue).
     * Requer SUPABASE_ANON_KEY e utilizador com identidade em auth.users (criada no registo ou em ensure).
     */
    async requestPasswordReset(emailRaw: string) {
        const email = emailRaw.trim().toLowerCase();
        if (!email) {
            throw new BadRequestException('Informe um e-mail válido.');
        }

        const user = await this.usuarioService.findByEmail(email);
        if (!user?.id) {
            throw new NotFoundException(
                'Não encontramos uma conta com este e-mail. Verifique o endereço ou crie uma conta.',
            );
        }

        const url = this.config.get<string>('SUPABASE_URL');
        const anonKey = this.config.get<string>('SUPABASE_ANON_KEY');
        if (!url || !anonKey) {
            console.error(
                '[auth] SUPABASE_URL ou SUPABASE_ANON_KEY ausente — configure para recovery por e-mail nativo.',
            );
            throw new ServiceUnavailableException(
                'Recuperação por e-mail não está configurada no servidor. Contacte o suporte.',
            );
        }

        await this.ensureAuthUserForSupabaseRecovery({ id: user.id, email: user.email });

        const frontend = (this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000').replace(
            /\/$/,
            '',
        );
        const redirectTo = `${frontend}/reset-password`;

        const anon = createClient(url, anonKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
        const { error } = await anon.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) {
            console.error('[auth] resetPasswordForEmail:', error.message);
            throw new BadRequestException(
                error.message || 'Não foi possível enviar o e-mail de recuperação. Tente novamente.',
            );
        }

        return {
            statusCode: 200,
            message: 'Enviamos as instruções para o seu e-mail. Verifique a caixa de entrada e o spam.',
        };
    }

    /**
     * Garante linha em auth.users para o mesmo id/e-mail do public.User (utilizadores antigos ou migração).
     */
    private async ensureAuthUserForSupabaseRecovery(user: { id: string; email: string }): Promise<void> {
        const admin = this.sb().auth.admin;
        const { data, error } = await admin.getUserById(user.id);
        if (!error && data?.user) {
            return;
        }

        const randomPassword = randomBytes(32).toString('base64url');
        const { error: createError } = await admin.createUser({
            id: user.id,
            email: user.email.trim().toLowerCase(),
            password: randomPassword,
            email_confirm: true,
        });
        if (
            createError &&
            !String(createError.message || '')
                .toLowerCase()
                .includes('already been registered')
        ) {
            console.warn('[auth] ensureAuthUserForSupabaseRecovery:', createError.message);
        }
    }

    /**
     * Após updateUser({ password }) no cliente Supabase, replica o hash na tabela User para o login JWT continuar válido.
     */
    async syncPasswordAfterSupabaseRecovery(accessToken: string, plainPassword: string) {
        const token = accessToken.trim();
        if (!token) {
            throw new UnauthorizedException('Token ausente');
        }
        const { data: userData, error } = await this.sb().auth.getUser(token);
        if (error || !userData.user?.email) {
            throw new UnauthorizedException('Sessão de recuperação inválida ou expirada');
        }
        const email = userData.user.email.trim().toLowerCase();
        const row = await this.usuarioService.findByEmail(email);
        if (!row?.id) {
            throw new BadRequestException('Conta não encontrada para este e-mail');
        }
        await this.usuarioService.setPasswordHash(row.id, plainPassword);
        return {
            statusCode: 200,
            message: 'Senha atualizada. Faça login com a nova senha.',
        };
    }

    async resetPasswordWithToken(token: string, newPassword: string) {
        const tokenHash = createHash('sha256').update(token).digest('hex');
        const res = await this.sb()
            .from(DbTable.PasswordReset)
            .select('id, userId, expiresAt, usedAt')
            .eq('tokenHash', tokenHash)
            .maybeSingle();
        if (res.error || !res.data) {
            throw new BadRequestException('Token inválido ou expirado');
        }
        const row = res.data as {
            id: string;
            userId: string;
            expiresAt: string;
            usedAt: string | null;
        };
        if (row.usedAt) {
            throw new BadRequestException('Token já utilizado');
        }
        if (new Date(row.expiresAt).getTime() < Date.now()) {
            throw new BadRequestException('Token expirado');
        }

        await this.usuarioService.setPasswordHash(row.userId, newPassword);
        const upd = await this.sb()
            .from(DbTable.PasswordReset)
            .update({ usedAt: new Date().toISOString() })
            .eq('id', row.id);
        ensureNoError(upd.error, upd.data, 'PasswordReset.use');

        return { statusCode: 200, message: 'Senha redefinida com sucesso' };
    }
}
