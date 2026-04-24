import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../types/authenticated-user';
import { jwtConstants } from './auth.constant';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(private readonly jwtService:JwtService, private reflector: Reflector) {}  
  async canActivate(context: ExecutionContext){

    //Verifica se a rota é pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler()
    ]);
  
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    const rawAuthUnknown: unknown =
      request.headers.authorization ?? request.headers['authorization'];
    let tokenHeader: string | undefined;
    if (typeof rawAuthUnknown === 'string') {
      tokenHeader = rawAuthUnknown;
    } else if (
      Array.isArray(rawAuthUnknown) &&
      rawAuthUnknown.length > 0 &&
      typeof rawAuthUnknown[0] === 'string'
    ) {
      tokenHeader = rawAuthUnknown[0];
    }
    if (!tokenHeader) {
      throw new UnauthorizedException();
    }

    try {
      const split = tokenHeader.split(' ');
      const jwtPart = split[1];

      if (!jwtPart) {
        throw new UnauthorizedException();
      }

      const verify = await this.jwtService.verifyAsync<JwtPayload>(jwtPart, {
        secret: jwtConstants.secret,
      });
      const user: AuthenticatedUser = {
        id: verify.sub,
        sub: verify.sub,
        email: verify.email,
        role: verify.role,
        tenantId: verify.tenantId,
        name: verify.name,
      };
      request.user = user;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }
}
