import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { CacheService } from '../../shared/services/cache.service';

export interface RateLimitOptions {
  windowMs: number; // Janela de tempo em millisegundos
  maxRequests: number; // Máximo de requests na janela
  skipIf?: (request: Request) => boolean;
  keyGenerator?: (request: Request) => string;
  message?: string; // Mensagem de erro customizada
}

const RATE_LIMIT_KEY = 'rate-limit';

// Decorator para configurar rate limit
export const RateLimit = (options: RateLimitOptions) => 
  SetMetadata(RATE_LIMIT_KEY, options);

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Buscar configurações do rate limit do endpoint
    const rateLimitConfig = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler()
    ) || this.getDefaultConfig();

    // Verificar se deve pular o rate limiting
    if (rateLimitConfig.skipIf && rateLimitConfig.skipIf(request)) {
      return true;
    }

    // Gerar chaves para tracking
    const keys = this.generateKeys(request, rateLimitConfig);
    
    // Verificar rate limit para cada chave
    for (const { key, limit, window, message } of keys) {
      const isAllowed = await this.checkRateLimit(key, limit, window);
      if (!isAllowed) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: message || 'Muitas requisições. Tente novamente mais tarde.',
            retryAfter: Math.ceil(window / 1000),
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }
    }

    return true;
  }

  private generateKeys(request: Request, config: RateLimitOptions) {
    const ip = this.getClientIp(request);
    const userId =
      request.user && typeof request.user === 'object' && 'id' in request.user
        ? (request.user as { id?: string }).id
        : undefined;
    const userAgent = request.headers['user-agent'] || 'unknown';
    const routePath =
      request.route && typeof request.route === 'object' && 'path' in request.route
        ? String((request.route as { path?: string }).path ?? '')
        : '';
    const endpoint = `${request.method}:${routePath || request.url}`;

    const keys: Array<{ key: string; limit: number; window: number; message: string }> = [];

    // Rate limit por IP (global)
    keys.push({
      key: `rate_limit:ip:${ip}:${endpoint}`,
      limit: config.maxRequests,
      window: config.windowMs,
      message: 'Limite de requisições por IP excedido'
    });

    // Rate limit por usuário (se autenticado)
    if (userId) {
      keys.push({
        key: `rate_limit:user:${userId}:${endpoint}`,
        limit: Math.ceil(config.maxRequests * 1.5), // 50% mais permissivo para usuários autenticados
        window: config.windowMs,
        message: 'Limite de requisições por usuário excedido'
      });

      // Rate limit global por usuário (todas as rotas)
      keys.push({
        key: `rate_limit:user_global:${userId}`,
        limit: config.maxRequests * 10, // Limite muito mais alto para global
        window: config.windowMs,
        message: 'Limite global de requisições por usuário excedido'
      });
    }

    // Rate limit por User-Agent suspeito (anti-bot)
    if (this.isSuspiciousUserAgent(userAgent)) {
      keys.push({
        key: `rate_limit:suspicious:${ip}:${this.hashUserAgent(userAgent)}`,
        limit: Math.ceil(config.maxRequests * 0.5), // Mais restritivo para bots
        window: config.windowMs,
        message: 'Atividade suspeita detectada'
      });
    }

    return keys;
  }

  private async checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
    try {
      // Buscar contador atual
      const current = await this.cacheService.get<number>(key) || 0;
      
      if (current >= maxRequests) {
        return false;
      }

      // Incrementar contador
      const newCount = current + 1;
      const ttl = Math.ceil(windowMs / 1000);
      
      await this.cacheService.set(key, newCount, { ttl });
      
      return true;
    } catch (error) {
      // Em caso de erro no cache, permitir a requisição (fail-open)
      console.error('Erro no rate limiting:', error);
      return true;
    }
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    const firstForwarded =
      typeof forwarded === 'string'
        ? forwarded.split(',')[0]?.trim()
        : Array.isArray(forwarded)
          ? forwarded[0]
          : undefined;
    const realIpHeader = request.headers['x-real-ip'];
    const real =
      firstForwarded ||
      (typeof realIpHeader === 'string' ? realIpHeader : Array.isArray(realIpHeader) ? realIpHeader[0] : undefined);
    return (
      real ||
      request.realIp ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http-client/i,
      /postman/i,
      /insomnia/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private hashUserAgent(userAgent: string): string {
    // Simple hash para agrupar user agents similares
    let hash = 0;
    for (let i = 0; i < userAgent.length; i++) {
      const char = userAgent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  private getDefaultConfig(): RateLimitOptions {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutos
      maxRequests: 100, // 100 requests por 15 minutos
      message: 'Muitas requisições. Tente novamente mais tarde.',
    };
  }
}

// Rate limits pré-definidos para diferentes tipos de endpoint
export const CommonRateLimits = {
  // Login: limite por IP na janela (anti-abuso, alinhado a tentativas de senha)
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 30,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  },

  REFRESH: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: 'Muitas tentativas de renovação. Aguarde um minuto.',
  },

  // API geral: uso normal
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100, // 100 requests
    message: 'Limite de requisições atingido. Tente novamente mais tarde.',
  },

  // Upload de arquivos: mais restritivo
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 10, // 10 uploads por hora
    message: 'Limite de uploads atingido. Tente novamente em 1 hora.',
  },

  // Relatórios: operações pesadas
  REPORTS: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 3, // 3 relatórios por 5 minutos
    message: 'Limite de geração de relatórios atingido. Tente novamente em 5 minutos.',
  },

  // Busca: permite mais requests mas com throttling
  SEARCH: {
    windowMs: 1 * 60 * 1000, // 1 minuto
    maxRequests: 30, // 30 buscas por minuto
    message: 'Muitas buscas realizadas. Aguarde um momento.',
  },
}; 