import {
    BadRequestException,
    Injectable,
    NotFoundException,
    ServiceUnavailableException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomBytes } from 'node:crypto';
import { DbTable } from '../database/db-tables';
import { SupabaseService } from '../supabase/supabase.service';
import { ensureNoError } from '../supabase/supabase-error.util';
import { UsuarioService } from '../usuario/usuario.service';

@Injectable()
export class AuthPasswordService {
    constructor(
        private readonly supabase: SupabaseService,
        private readonly config: ConfigService,
        private readonly usuarioService: UsuarioService,
    ) {}

    private sb() {
        return this.supabase.getClient();
    }

    private tryParseHttpOrigin(value: string): string | null {
        const trimmed = value.trim().replace(/\/$/, '');
        if (!trimmed) return null;
        try {
            const u = new URL(trimmed);
            if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
            return u.origin;
        } catch {
            return null;
        }
    }

    private originsMatchAllowlistEntry(allowed: string, candidate: string): boolean {
        try {
            const a = new URL(allowed);
            const c = new URL(candidate);
            return (
                a.protocol === c.protocol &&
                a.hostname.toLowerCase() === c.hostname.toLowerCase() &&
                a.port === c.port
            );
        } catch {
            return false;
        }
    }

    private getAllowedFrontendOrigins(): string[] {
        const raw = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        const seen = new Set<string>();
        const list: string[] = [];
        for (const part of raw.split(',')) {
            const o = this.tryParseHttpOrigin(part);
            if (o && !seen.has(o)) {
                seen.add(o);
                list.push(o);
            }
        }
        return list.length > 0 ? list : ['http://localhost:3000'];
    }

    resolvePasswordResetRedirectBase(clientOriginRaw?: string): string {
        const allowed = this.getAllowedFrontendOrigins();
        let base = allowed[0];
        const candidate = clientOriginRaw?.trim();
        if (candidate) {
            const normalized = this.tryParseHttpOrigin(candidate);
            if (
                normalized &&
                allowed.some((o) => this.originsMatchAllowlistEntry(o, normalized))
            ) {
                base = normalized;
            }
        }
        return base.replace(/\/$/, '');
    }

    async requestPasswordReset(emailRaw: string, clientOriginRaw?: string) {
        const email = emailRaw.trim().toLowerCase();
        if (!email) throw new BadRequestException('Informe um e-mail válido.');

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

        const frontend = this.resolvePasswordResetRedirectBase(clientOriginRaw);
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

    private async ensureAuthUserForSupabaseRecovery(user: { id: string; email: string }): Promise<void> {
        const admin = this.sb().auth.admin;
        const { data, error } = await admin.getUserById(user.id);
        if (!error && data?.user) return;

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

    async syncPasswordAfterSupabaseRecovery(accessToken: string, plainPassword: string) {
        const token = accessToken.trim();
        if (!token) throw new UnauthorizedException('Token ausente');
        const { data: userData, error } = await this.sb().auth.getUser(token);
        if (error || !userData.user?.email) {
            throw new UnauthorizedException('Sessão de recuperação inválida ou expirada');
        }
        const email = userData.user.email.trim().toLowerCase();
        const row = await this.usuarioService.findByEmail(email);
        if (!row?.id) throw new BadRequestException('Conta não encontrada para este e-mail');
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
        if (res.error || !res.data) throw new BadRequestException('Token inválido ou expirado');

        const row = res.data as {
            id: string;
            userId: string;
            expiresAt: string;
            usedAt: string | null;
        };
        if (row.usedAt) throw new BadRequestException('Token já utilizado');
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
