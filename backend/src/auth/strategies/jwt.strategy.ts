import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser } from '../../types/authenticated-user';
import { UsuarioService } from '../../usuario/usuario.service';
import { jwtConstants } from '../auth.constant';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly usuarioService: UsuarioService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Tokens com `exp` expirados são rejeitados. Tokens legados sem `exp` não disparam verificação de expiração.
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub) {
      throw new UnauthorizedException('Token inválido - sub não encontrado');
    }

    // Validar se o usuário ainda existe e está ativo no banco
    const user = await this.usuarioService.findOne(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuário inativo');
    }

    const tenantId = payload.tenantId || user.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException('Tenant não identificado para o usuário');
    }

    return {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId,
      name: payload.name || user.name,
    };
  }
} 