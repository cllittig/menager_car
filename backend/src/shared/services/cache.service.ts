import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CacheOptions {
  ttl?: number; 
  compress?: boolean; 
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private readonly isProduction: boolean;
  private readonly fallbackCache = new Map<string, { value: unknown; expires: number }>();

  constructor(private configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    void this.initializeRedis();
  }

  private redisEnabled(): boolean {
    const flag = this.configService.get<string>('REDIS_ENABLED');
    if (flag === 'true') {
      return true;
    }
    if (flag === 'false') {
      return false;
    }
    return this.isProduction;
  }

  private async initializeRedis() {
    if (!this.redisEnabled()) {
      this.logger.log('Redis desabilitado por configuração - usando cache em memória');
      return;
    }

    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
      const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
      const redisPassword = this.configService.get<string>('REDIS_PASSWORD');
      const redisDb = this.configService.get<number>('REDIS_DB', 0);

      const baseOptions = {
        maxRetriesPerRequest: 1,
        lazyConnect: true,

        retryStrategy: () => null,
      };

      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          ...baseOptions,
        });
      } else {
        this.redis = new Redis({
          ...baseOptions,
          host: redisHost,
          port: redisPort,
          password: redisPassword,
          db: redisDb,
        });
      }

      this.redis.on('connect', () => {
        this.logger.log('Redis conectado com sucesso');
      });

      this.redis.on('error', (error) => {
        this.logger.error('Erro no Redis:', error);
      });

      await this.redis.connect();
    } catch (error) {
      this.logger.error('Falha ao conectar no Redis, usando cache em memória:', error);
      this.redis = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.redis) {
        const value = await this.redis.get(key);
        if (value) {
          const parsed: unknown = JSON.parse(value);
          return parsed as T;
        }
      } else {

        const cached = this.fallbackCache.get(key);
        if (cached && cached.expires > Date.now()) {
          return cached.value as T;
        } else if (cached) {
          this.fallbackCache.delete(key);
        }
      }
      return null;
    } catch (error) {
      this.logger.error(`Erro ao buscar cache para key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: unknown, options: CacheOptions = {}): Promise<void> {
    const { ttl = 300 } = options;

    try {
      const serializedValue = JSON.stringify(value);

      if (this.redis) {
        if (ttl > 0) {
          await this.redis.setex(key, ttl, serializedValue);
        } else {
          await this.redis.set(key, serializedValue);
        }
      } else {
        // Fallback para cache em memória
        this.fallbackCache.set(key, {
          value,
          expires: Date.now() + (ttl * 1000)
        });
      }
    } catch (error) {
      this.logger.error(`Erro ao salvar cache para key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      } else {
        this.fallbackCache.delete(key);
      }
    } catch (error) {
      this.logger.error(`Erro ao deletar cache para key ${key}:`, error);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // Fallback para cache em memória
        const keysToDelete = Array.from(this.fallbackCache.keys()).filter(key =>
          key.match(pattern.replace(/\*/g, '.*'))
        );
        keysToDelete.forEach(key => this.fallbackCache.delete(key));
      }
    } catch (error) {
      this.logger.error(`Erro ao deletar cache por pattern ${pattern}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.flushdb();
      } else {
        this.fallbackCache.clear();
      }
    } catch (error) {
      this.logger.error('Erro ao limpar todo o cache:', error);
    }
  }

  // Cache específico para dados de usuário
  async getUserCache<T>(userId: string, key: string): Promise<T | null> {
    return this.get(`user:${userId}:${key}`);
  }

  async setUserCache(userId: string, key: string, value: unknown, ttl = 300): Promise<void> {
    return this.set(`user:${userId}:${key}`, value, { ttl });
  }

  async clearUserCache(userId: string): Promise<void> {
    return this.delByPattern(`user:${userId}:*`);
  }

  // Cache para estatísticas (TTL maior)
  async getStats<T>(key: string): Promise<T | null> {
    return this.get(`stats:${key}`);
  }

  async setStats(key: string, value: unknown, ttl = 3600): Promise<void> {
    return this.set(`stats:${key}`, value, { ttl }); // 1 hora
  }

  // Cache para consultas SQL complexas
  async getQuery<T>(query: string, params: unknown[]): Promise<T | null> {
    const key = `query:${Buffer.from(query + JSON.stringify(params)).toString('base64')}`;
    return this.get(key);
  }

  async setQuery(query: string, params: unknown[], result: unknown, ttl = 600): Promise<void> {
    const key = `query:${Buffer.from(query + JSON.stringify(params)).toString('base64')}`;
    return this.set(key, result, { ttl }); // 10 minutos
  }

  // Cleanup automático do cache em memória
  private startCleanupInterval() {
    if (!this.redis) {
      setInterval(() => {
        const now = Date.now();
        for (const [key, cached] of this.fallbackCache.entries()) {
          if (cached.expires <= now) {
            this.fallbackCache.delete(key);
          }
        }
      }, 60000); // Limpar a cada minuto
    }
  }

  onModuleInit(): void {
    this.startCleanupInterval();
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
} 