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
import { AuthPasswordService } from './auth-password.service';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
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

                    expiresIn: config.get<string>('JWT_ACCESS_EXPIRES', '15m') as SignOptions['expiresIn'],
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        AuthSessionService,
        AuthPasswordService,
        AuthGuard,
        JwtStrategy,
        JwtAuthGuard,
        RolesGuard,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard, 
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
    exports: [AuthService, JwtAuthGuard, RolesGuard, AuthGuard, JwtModule]
})
export class AuthModule { }
