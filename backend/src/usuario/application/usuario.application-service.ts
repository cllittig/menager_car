import { HttpException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { Role } from '../../database/domain.enums';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import type {
  UsuarioCreateSuccess,
  UsuarioListRow,
  UsuarioMutationError,
} from '../domain/usuario.types';
import { SupabaseService } from '../../supabase/supabase.service';
import { UsuarioRepository } from '../domain/repositories/usuario.repository';
import type { Usuario } from '../interfaces/usuario.interface';

@Injectable()
export class UsuarioApplicationService {
  private readonly logger = new Logger(UsuarioApplicationService.name);

  constructor(
    private readonly repository: UsuarioRepository,
    private readonly supabase: SupabaseService,
  ) {}

  async create(
    createUsuarioDto: CreateUsuarioDto,
  ): Promise<UsuarioCreateSuccess | UsuarioMutationError> {
    const hashedPassword = await bcrypt.hash(createUsuarioDto.senha, 10);
    const emailNorm = createUsuarioDto.email.trim().toLowerCase();
    const tenantLabel = (createUsuarioDto.nomeEmpresa?.trim() || createUsuarioDto.nome).trim();
    const baseSlug = tenantLabel
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    let createdAuthUserId: string | undefined;
    try {
      const { data: authData, error: authErr } = await this.supabase
        .getClient()
        .auth.admin.createUser({
          email: emailNorm,
          password: createUsuarioDto.senha,
          email_confirm: true,
          user_metadata: { name: createUsuarioDto.nome },
        });
      if (authErr) {
        const msg = String(authErr.message || '');
        const duplicate = msg.toLowerCase().includes('already been registered');
        return {
          statusCode: duplicate ? 409 : 400,
          message: duplicate ? 'E-mail já cadastrado' : msg || 'Falha ao criar identidade de acesso',
        };
      }
      if (!authData.user?.id) {
        return {
          statusCode: 500,
          message: 'Resposta inválida do provedor de identidade',
        };
      }
      createdAuthUserId = authData.user.id;

      const now = new Date().toISOString();
      const tenantId = randomUUID();

      await this.repository.insertTenant({
        id: tenantId,
        name: tenantLabel,
        slug: `${baseSlug || 'tenant'}-${Date.now()}`,
        isActive: true,
      });

      await this.repository.insertUser({
        id: createdAuthUserId,
        email: emailNorm,
        password: hashedPassword,
        name: createUsuarioDto.nome,
        role: Role.USER,
        tenantId,
        createdAt: now,
        updatedAt: now,
      });

      return {
        code: 200,
        message: 'Usuario cadastrado com sucesso',
      };
    } catch (error) {
      if (createdAuthUserId) {
        this.supabase
          .getClient()
          .auth.admin.deleteUser(createdAuthUserId)
          .catch((e: unknown) => {
            this.logger.warn(
              `Rollback auth user ${createdAuthUserId}: ${e instanceof Error ? e.message : String(e)}`,
            );
          });
      }
      if (error instanceof HttpException) {
        throw error;
      }
      return {
        statusCode: 500,
        message: 'Erro ao cadastrar usuario',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async findAllByTenant(tenantId: string): Promise<UsuarioListRow[]> {
    return this.repository.findAllByTenant(tenantId);
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    return this.repository.findByEmail(email);
  }

  async findOne(id: string): Promise<UsuarioListRow | null> {
    return this.repository.findOne(id);
  }

  async findOneInTenant(id: string, tenantId: string): Promise<UsuarioListRow | null> {
    return this.repository.findOneInTenant(id, tenantId);
  }

  async update(
    id: string,
    updateUsuarioDto: UpdateUsuarioDto,
    tenantId: string,
  ): Promise<UsuarioMutationError | { statusCode: number; message: string }> {
    if (updateUsuarioDto.senha) {
      updateUsuarioDto.senha = await bcrypt.hash(updateUsuarioDto.senha, 10);
    }
    try {
      const payload: Record<string, unknown> = {};
      if (updateUsuarioDto.nome !== undefined) payload.name = updateUsuarioDto.nome;
      if (updateUsuarioDto.email !== undefined) payload.email = updateUsuarioDto.email;
      if (updateUsuarioDto.senha !== undefined) payload.password = updateUsuarioDto.senha;
      if (updateUsuarioDto.role !== undefined) payload.role = updateUsuarioDto.role;
      if (Object.keys(payload).length === 0) {
        return {
          statusCode: 400,
          message: 'Nenhum campo para atualizar',
        };
      }
      payload.updatedAt = new Date().toISOString();

      const updated = await this.repository.updateUser(id, tenantId, payload);
      if (!updated) {
        return {
          statusCode: 404,
          message: 'Usuario não encontrado',
        };
      }
      return {
        statusCode: 200,
        message: 'Usuario atualizado com sucesso',
      };
    } catch {
      return {
        statusCode: 404,
        message: 'Usuario não encontrado',
      };
    }
  }

  async remove(
    id: string,
    tenantId: string,
  ): Promise<{ statusCode: number; message: string }> {
    try {
      const deleted = await this.repository.deleteUser(id, tenantId);
      if (!deleted) {
        return {
          statusCode: 404,
          message: 'Usuario não encontrado',
        };
      }
      return {
        statusCode: 200,
        message: 'Usuario removido com sucesso',
      };
    } catch {
      return {
        statusCode: 404,
        message: 'Usuario não encontrado',
      };
    }
  }

  async setPasswordHash(userId: string, plainPassword: string): Promise<void> {
    const hash = await bcrypt.hash(plainPassword, 10);
    const now = new Date().toISOString();
    await this.repository.setPasswordHash(userId, hash, now);
  }

  async resetLoginAttempts(id: string): Promise<void> {
    const ts = new Date().toISOString();
    await this.repository.resetLoginAttempts(id, ts);
  }

  async recordFailedLogin(email: string): Promise<void> {
    const user = await this.repository.findByEmail(email);
    if (!user?.id) {
      return;
    }
    const attempts = (user.loginAttempts ?? 0) + 1;
    const ts = new Date().toISOString();
    await this.repository.updateLoginAttempts(user.id, attempts, ts);
  }
}
