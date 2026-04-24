import { Injectable, NotFoundException } from '@nestjs/common';
import { DbTable } from '../../database/db-tables';
import { SupabaseService } from '../../supabase/supabase.service';

/**
 * Serviço de aplicação transversal: resolve o tenant do usuário autenticado.
 * Evita duplicar acesso ao Supabase em cada bounded context.
 */
@Injectable()
export class TenantResolutionService {
  constructor(private readonly supabase: SupabaseService) {}

  async getTenantIdByUserIdOrThrow(userId: string): Promise<string> {
    const res = await this.supabase
      .getClient()
      .from(DbTable.User)
      .select('tenantId')
      .eq('id', userId)
      .maybeSingle();
    const tenantId = res.data?.tenantId as string | undefined;
    if (!tenantId) {
      throw new NotFoundException('Tenant do usuário não encontrado');
    }
    return tenantId;
  }
}
