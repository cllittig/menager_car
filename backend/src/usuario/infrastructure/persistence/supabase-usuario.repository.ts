import { Injectable } from '@nestjs/common';
import { DbTable } from '../../../database/db-tables';
import { ensureNoError } from '../../../supabase/supabase-error.util';
import { SupabaseService } from '../../../supabase/supabase.service';
import type { Usuario } from '../../interfaces/usuario.interface';
import type { UsuarioListRow } from '../../domain/usuario.types';
import { UsuarioRepository } from '../../domain/repositories/usuario.repository';

@Injectable()
export class SupabaseUsuarioRepository extends UsuarioRepository {
  constructor(private readonly supabase: SupabaseService) {
    super();
  }

  private sb() {
    return this.supabase.getClient();
  }

  async insertTenant(row: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  }): Promise<void> {
    const tenantIns = await this.sb()
      .from(DbTable.Tenant)
      .insert({
        id: row.id,
        name: row.name,
        slug: row.slug,
        isActive: row.isActive,
      })
      .select('id')
      .single();

    ensureNoError(tenantIns.error, tenantIns.data, 'Tenant.create');
  }

  async insertUser(row: {
    id: string;
    email: string;
    password: string;
    name: string;
    role: string;
    tenantId: string;
    createdAt: string;
    updatedAt: string;
  }): Promise<void> {
    const userIns = await this.sb()
      .from(DbTable.User)
      .insert({
        id: row.id,
        email: row.email,
        password: row.password,
        name: row.name,
        role: row.role,
        tenantId: row.tenantId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
      .select('id')
      .single();

    ensureNoError(userIns.error, userIns.data, 'User.create');
  }

  async findAllByTenant(tenantId: string): Promise<UsuarioListRow[]> {
    const res = await this.sb()
      .from(DbTable.User)
      .select('id, name, email, role, tenantId, isActive')
      .eq('tenantId', tenantId)
      .order('name', { ascending: true });
    ensureNoError(res.error, res.data, 'User.findAllByTenant');
    return (res.data ?? []) as UsuarioListRow[];
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const normalized = email.trim().toLowerCase();
    const res = await this.sb()
      .from(DbTable.User)
      .select('*')
      .eq('email', normalized)
      .maybeSingle();
    if (res.error || !res.data) {
      return null;
    }
    return res.data as unknown as Usuario;
  }

  async findOne(id: string): Promise<UsuarioListRow | null> {
    const res = await this.sb()
      .from(DbTable.User)
      .select('id, name, email, role, tenantId, isActive')
      .eq('id', id)
      .maybeSingle();
    if (res.error || !res.data) {
      return null;
    }
    return res.data as UsuarioListRow;
  }

  async findOneInTenant(id: string, tenantId: string): Promise<UsuarioListRow | null> {
    const res = await this.sb()
      .from(DbTable.User)
      .select('id, name, email, role, tenantId, isActive')
      .eq('id', id)
      .eq('tenantId', tenantId)
      .maybeSingle();
    if (res.error || !res.data) {
      return null;
    }
    return res.data as UsuarioListRow;
  }

  async updateUser(
    id: string,
    tenantId: string,
    payload: Record<string, unknown>,
  ): Promise<{ id: string } | null> {
    const res = await this.sb()
      .from(DbTable.User)
      .update(payload)
      .eq('id', id)
      .eq('tenantId', tenantId)
      .select('id')
      .maybeSingle();
    if (res.error || !res.data) {
      return null;
    }
    return res.data as { id: string };
  }

  async deleteUser(id: string, tenantId: string): Promise<{ id: string } | null> {
    const res = await this.sb()
      .from(DbTable.User)
      .delete()
      .eq('id', id)
      .eq('tenantId', tenantId)
      .select('id')
      .maybeSingle();
    if (res.error || !res.data) {
      return null;
    }
    return res.data as { id: string };
  }

  async setPasswordHash(userId: string, hash: string, nowIso: string): Promise<void> {
    const res = await this.sb()
      .from(DbTable.User)
      .update({ password: hash, passwordChangedAt: nowIso, updatedAt: nowIso })
      .eq('id', userId);
    ensureNoError(res.error, res.data, 'User.setPassword');
  }

  async resetLoginAttempts(id: string, timestampIso: string): Promise<void> {
    const res = await this.sb()
      .from(DbTable.User)
      .update({
        loginAttempts: 0,
        lastLoginAttempt: timestampIso,
      })
      .eq('id', id);
    ensureNoError(res.error, res.data, 'User.resetLoginAttempts');
  }

  async updateLoginAttempts(
    userId: string,
    attempts: number,
    timestampIso: string,
  ): Promise<void> {
    const res = await this.sb()
      .from(DbTable.User)
      .update({
        loginAttempts: attempts,
        lastLoginAttempt: timestampIso,
      })
      .eq('id', userId);
    ensureNoError(res.error, res.data, 'User.recordFailedLogin');
  }
}
