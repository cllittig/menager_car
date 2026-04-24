import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

export interface CurrentUserPayload {
  id: string;
  email: string;
  role: string;
  sub: string;
  tenantId: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    if (!user.sub && !user.id) {
      throw new UnauthorizedException('Token inválido - ID do usuário não encontrado');
    }

    return {
      id: user.sub || user.id,
      email: user.email,
      role: user.role,
      sub: user.sub || user.id,
      tenantId: user.tenantId,
    };
  },
);

/**
 * Decorator para extrair apenas o ID do usuário autenticado
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    const userId = user.sub || user.id;
    if (!userId) {
      throw new UnauthorizedException('Token inválido - ID do usuário não encontrado');
    }

    return userId;
  },
); 

export const CurrentTenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;

    if (!user?.tenantId) {
      throw new UnauthorizedException('Tenant não identificado no token');
    }

    return user.tenantId;
  },
);