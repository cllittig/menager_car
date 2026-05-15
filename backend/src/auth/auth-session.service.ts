import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { DbTable } from '../database/db-tables';
import { SupabaseService } from '../supabase/supabase.service';
import { ensureNoError } from '../supabase/supabase-error.util';

export type RefreshMeta = { userAgent?: string; ip?: string };

export type RefreshSessionRow = {
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: string;
    replacedBySessionId: string | null;
    revokedAt: string | null;
};

@Injectable()
export class AuthSessionService {
    private readonly logger = new Logger(AuthSessionService.name);

    constructor(
        private readonly supabase: SupabaseService,
        private readonly config: ConfigService,
    ) {}

    private sb() {
        return this.supabase.getClient();
    }

    hashRefresh(raw: string): string {
        return createHash('sha256').update(raw).digest('hex');
    }

    parseDurationToSeconds(value: string): number {
        const v = value.trim();
        if (/^\d+$/.test(v)) return parseInt(v, 10);
        const m = /^(\d+)\s*([smhd])$/i.exec(v);
        if (!m) return 900;
        const n = parseInt(m[1], 10);
        switch (m[2].toLowerCase()) {
            case 's': return n;
            case 'm': return n * 60;
            case 'h': return n * 3600;
            case 'd': return n * 86400;
            default:  return 900;
        }
    }

    getAccessTtlSeconds(): number {
        const sec = this.config.get<string>('JWT_ACCESS_EXPIRES_SEC');
        if (sec && /^\d+$/.test(sec)) return parseInt(sec, 10);
        return this.parseDurationToSeconds(
            this.config.get<string>('JWT_ACCESS_EXPIRES', '15m'),
        );
    }

    getRefreshTtlMs(): number {
        const daysRaw = this.config.get<string>('JWT_REFRESH_EXPIRES_DAYS', '30');
        const days = /^\d+$/.test(daysRaw) ? parseInt(daysRaw, 10) : 30;
        return Math.max(1, days) * 24 * 60 * 60 * 1000;
    }

    async findRefreshSession(tokenHash: string): Promise<RefreshSessionRow | null> {
        const res = await this.sb()
            .from(DbTable.RefreshSession)
            .select('id, userId, familyId, expiresAt, replacedBySessionId, revokedAt')
            .eq('tokenHash', tokenHash)
            .maybeSingle();
        if (res.error || !res.data) return null;
        return res.data as RefreshSessionRow;
    }

    async insertRefreshSession(params: {
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

    async revokeRefreshFamily(familyId: string): Promise<void> {
        const now = new Date().toISOString();
        await this.sb()
            .from(DbTable.RefreshSession)
            .update({ revokedAt: now })
            .eq('familyId', familyId)
            .is('revokedAt', null);
    }

    async revokeByTokenHash(tokenHash: string): Promise<void> {
        const now = new Date().toISOString();
        const upd = await this.sb()
            .from(DbTable.RefreshSession)
            .update({ revokedAt: now })
            .eq('tokenHash', tokenHash)
            .is('revokedAt', null);
        ensureNoError(upd.error, upd.data, 'RefreshSession.revoke');
    }

    async revokeAllRefreshSessionsForUser(userId: string): Promise<void> {
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

    async createRefreshTokenPair(
        userId: string,
        meta?: RefreshMeta,
    ): Promise<{ refreshToken: string; familyId: string }> {
        const familyId = randomUUID();
        const raw = randomBytes(48).toString('base64url');
        const tokenHash = this.hashRefresh(raw);
        const expiresAt = new Date(Date.now() + this.getRefreshTtlMs());
        await this.insertRefreshSession({ userId, familyId, tokenHash, expiresAt, meta });
        return { refreshToken: raw, familyId };
    }

    async rotateRefreshToken(
        oldSessionId: string,
        familyId: string,
        userId: string,
        meta?: RefreshMeta,
    ): Promise<{ newRaw: string; newSessionId: string }> {
        const newRaw = randomBytes(48).toString('base64url');
        const newHash = this.hashRefresh(newRaw);
        const expiresAt = new Date(Date.now() + this.getRefreshTtlMs());
        const newSessionId = randomUUID();
        const nowIso = new Date().toISOString();

        const ins = await this.sb()
            .from(DbTable.RefreshSession)
            .insert({
                id: newSessionId,
                userId,
                tokenHash: newHash,
                familyId,
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
            .eq('id', oldSessionId)
            .is('replacedBySessionId', null);
        ensureNoError(upd.error, upd.data, 'RefreshSession.rotateMarkOld');

        return { newRaw, newSessionId };
    }
}
