import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Cache } from 'cache-manager';
import type { Request } from 'express';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {}

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
        const request = context.switchToHttp().getRequest<Request>();
        
        // Não fazer cache de requisições POST, PUT, DELETE
        if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
            return next.handle();
        }

        const key = this.generateCacheKey(request);
        const cachedResponse = await this.cacheManager.get(key);

        if (cachedResponse) {
            return of(cachedResponse);
        }

        return next.handle().pipe(
            tap((response: unknown) => {
                void this.cacheManager.set(key, response, 300000);
            }),
        );
    }

    private generateCacheKey(request: Request): string {
        const { url, method, params, query } = request;
        return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(query)}`;
    }
} 