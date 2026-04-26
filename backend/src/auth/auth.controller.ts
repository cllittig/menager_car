import {
    Body,
    Controller,
    Get,
    Headers,
    Post,
    Req,
    UnauthorizedException,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser, CurrentUserPayload } from './decorators/current-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SyncPasswordRecoveryDto } from './dto/sync-password-recovery.dto';
import { CommonRateLimits, RateLimit, RateLimitGuard } from './guards/rate-limit.guard';
import { Public } from './public.decorator';

function clientMeta(req: Request): { userAgent?: string; ip?: string } {
    const xf = req.headers['x-forwarded-for'];
    const ip =
        (typeof xf === 'string' ? xf.split(',')[0]?.trim() : undefined) ||
        (req.headers['x-real-ip'] as string | undefined) ||
        req.ip;
    return {
        userAgent: req.headers['user-agent'],
        ip,
    };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Public()
    @UseGuards(RateLimitGuard)
    @RateLimit(CommonRateLimits.LOGIN)
    @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 tentativas por minuto (backup)
    @Post('login')
    @ApiOperation({
        summary: 'Realizar login',
        description: 'Autentica um usuário e retorna um token JWT',
    })
    @ApiBody({
        type: LoginDto,
        description: 'Credenciais de login',
        examples: {
            example: {
                summary: 'Exemplo de Login',
                value: {
                    email: 'seu@email.com',
                    senha: 'sua-senha-segura',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Login realizado com sucesso',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 200 },
                message: { type: 'string', example: 'Login realizado com sucesso' },
                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number', example: 900 },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'uuid' },
                        email: { type: 'string', example: 'admin@controleveicular.com' },
                        name: { type: 'string', example: 'Administrador' },
                        role: { type: 'string', example: 'ADMIN' },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Credenciais inválidas',
    })
    @ApiResponse({
        status: 400,
        description: 'Dados de entrada inválidos',
    })
    async login(@Body() loginDto: LoginDto, @Req() req: Request) {
        return await this.authService.login(loginDto, clientMeta(req));
    }

    @Public()
    @UseGuards(RateLimitGuard)
    @RateLimit(CommonRateLimits.REFRESH)
    @Post('refresh')
    @ApiOperation({ summary: 'Renovar access token (refresh com rotação)' })
    @ApiResponse({ status: 200, description: 'Tokens renovados' })
    @ApiResponse({ status: 401, description: 'Refresh inválido ou reuso detectado' })
    async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
        return this.authService.refresh(dto.refreshToken, clientMeta(req));
    }

    @Public()
    @Post('logout')
    @ApiOperation({ summary: 'Revogar sessão de refresh (opcional)' })
    async logout(@Body() dto: LogoutDto) {
        return this.authService.logoutRefresh(dto?.refreshToken);
    }

    @Public()
    @Post('forgot-password')
    @ApiOperation({
        summary: 'Solicitar redefinição de senha',
        description:
            'Só envia e-mail se o endereço existir na tabela User da aplicação. Caso contrário, responde 404.',
    })
    @ApiResponse({ status: 200, description: 'E-mail de recuperação enviado (Supabase Auth)' })
    @ApiResponse({ status: 404, description: 'E-mail não cadastrado na base da aplicação' })
    @ApiResponse({ status: 400, description: 'Falha ao enviar (ex.: Supabase Auth) ou e-mail inválido' })
    @ApiResponse({ status: 503, description: 'Servidor sem SUPABASE_URL / SUPABASE_ANON_KEY configurados' })
    async forgotPassword(@Body(new ValidationPipe({ whitelist: true })) dto: ForgotPasswordDto) {
        return this.authService.requestPasswordReset(dto.email);
    }

    @Public()
    @Post('reset-password')
    @ApiOperation({ summary: 'Redefinir senha com token' })
    async resetPassword(@Body(new ValidationPipe({ whitelist: true })) dto: ResetPasswordDto) {
        return this.authService.resetPasswordWithToken(dto.token, dto.senha);
    }

    @Public()
    @Post('sync-password-from-recovery')
    @ApiOperation({
        summary: 'Sincronizar senha após recuperação Supabase',
        description:
            'Chame após supabase.auth.updateUser({ password }) com o access_token da sessão de recuperação no header Authorization.',
    })
    async syncPasswordFromRecovery(
        @Headers('authorization') authorization: string | undefined,
        @Body(new ValidationPipe({ whitelist: true })) dto: SyncPasswordRecoveryDto,
    ) {
        const raw = authorization?.trim() ?? '';
        const token = raw.replace(/^Bearer\s+/i, '');
        if (!token) {
            throw new UnauthorizedException('Authorization Bearer obrigatório');
        }
        return this.authService.syncPasswordAfterSupabaseRecovery(token, dto.senha);
    }

    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Obter dados do usuário atual',
        description: 'Retorna os dados do usuário autenticado baseado no token JWT',
    })
    @ApiResponse({
        status: 200,
        description: 'Dados do usuário atual',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 200 },
                message: { type: 'string', example: 'Dados do usuário obtidos com sucesso' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'uuid' },
                        email: { type: 'string', example: 'admin@controleveicular.com' },
                        name: { type: 'string', example: 'Administrador' },
                        role: { type: 'string', example: 'ADMIN' },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Token inválido ou expirado',
    })
    async getCurrentUser(@CurrentUser() user: CurrentUserPayload) {
        return await this.authService.getCurrentUser(user.id);
    }
}
