import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  it('should be defined', () => {
    const jwtService = {} as JwtService;
    const reflector = new Reflector();
    expect(new AuthGuard(jwtService, reflector)).toBeDefined();
  });
});
