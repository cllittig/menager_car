import type { Usuario } from '../../interfaces/usuario.interface';
import type { UsuarioListRow } from '../usuario.types';

/** Porta de persistência do contexto Usuário (Supabase). */
export abstract class UsuarioRepository {
  abstract insertTenant(row: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  }): Promise<void>;

  abstract insertUser(row: {
    id: string;
    email: string;
    password: string;
    name: string;
    role: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
  }): Promise<void>;

  abstract findAllByTenant(tenantId: string): Promise<UsuarioListRow[]>;

  abstract findByEmail(email: string): Promise<Usuario | null>;

  abstract findOne(id: string): Promise<UsuarioListRow | null>;

  abstract findOneInTenant(id: string, tenantId: string): Promise<UsuarioListRow | null>;

  abstract updateUser(
    id: string,
    tenantId: string,
    payload: Record<string, unknown>,
  ): Promise<{ id: string } | null>;

  abstract deleteUser(id: string, tenantId: string): Promise<{ id: string } | null>;

  abstract setPasswordHash(userId: string, hash: string, nowIso: string): Promise<void>;

  abstract resetLoginAttempts(id: string, timestampIso: string): Promise<void>;

  abstract updateLoginAttempts(
    userId: string,
    attempts: number,
    timestampIso: string,
  ): Promise<void>;
}
