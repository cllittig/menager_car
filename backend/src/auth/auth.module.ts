import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { SignOptions } from 'jsonwebtoken';
import { UsuarioModule } from '../usuario/usuario.module';
import { jwtConstants } from './auth.constant';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Global()
@Module({
    imports: [
        UsuarioModule,
        PassportModule,
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => ({
                secret: jwtConstants.secret,
                signOptions: {
                    // Novos logins recebem `exp`. Tokens legados sem `exp` seguem válidos.
                    expiresIn: config.get<string>('JWT_ACCESS_EXPIRES', '15m') as SignOptions['expiresIn'],
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        AuthGuard,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard, // Usar JwtAuthGuard como guard global
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
    exports: [AuthService, JwtAuthGuard, RolesGuard, AuthGuard, JwtModule]
})
export class AuthModule { }
