import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../shared/services/audit.service';

type AuthedRequest = Request & {
  user?: { id: string };
  body?: unknown;
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const { method, url, user } = request;
    const body: unknown = request.body;

    // Só auditar se o usuário estiver autenticado
    if (!user?.id) {
      return next.handle();
    }

    const startTime = Date.now();

    const clientIp = request.realIp || request.ip || '';

    return next.handle().pipe(
      tap({
        next: (result: unknown) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          // Determinar o tipo de ação baseado no método HTTP
          const action = this.getActionFromMethod(method);
          
          // Determinar a entidade baseada na URL
          const entity = this.getEntityFromUrl(url);

          // Só auditar operações importantes (não GET simples)
          if (action !== 'READ' || this.shouldAuditRead(url)) {
            void this.auditService.logAction({
              userId: user.id,
              action: `${action}_${entity.toUpperCase()}`,
              entity: entity,
              entityId: this.extractEntityId(url, result),
              details: {
                method,
                url,
                duration,
                userAgent: request.headers['user-agent'],
                ip: clientIp,
                ...(body && this.shouldLogBody(method) ? { requestBody: body } : {}),
                ...(result && this.shouldLogResult(method) ? { responseData: this.sanitizeResult(result) } : {}),
              },
              ipAddress: clientIp,
            });
          }
        },
        error: (err: unknown) => {
          const errMessage = err instanceof Error ? err.message : String(err);
          void this.auditService.logAction({
            userId: user.id,
            action: `ERROR_${this.getEntityFromUrl(url).toUpperCase()}`,
            entity: this.getEntityFromUrl(url),
            entityId: this.extractEntityId(url, null),
            details: {
              method,
              url,
              error: errMessage,
              userAgent: request.headers['user-agent'],
              ip: clientIp,
            },
            ipAddress: clientIp,
          });
        },
      }),
    );
  }

  private getActionFromMethod(method: string): string {
    const methodActions: Record<string, string> = {
      GET: 'READ',
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return methodActions[method] ?? 'UNKNOWN';
  }

  private getEntityFromUrl(url: string): string {
    // Extrair entidade da URL (ex: /vehicles/123 -> vehicles)
    const pathParts = url.split('/').filter(part => part && part !== 'api');
    return pathParts[0] || 'unknown';
  }

  private extractEntityId(url: string, result: unknown): string {
    // Tentar extrair ID da URL
    const urlMatch = url.match(/\/([a-f0-9-]{36})/);
    if (urlMatch) {
      return urlMatch[1];
    }

    if (result && typeof result === 'object' && result !== null && 'id' in result) {
      const id = (result as { id: unknown }).id;
      if (typeof id === 'string') {
        return id;
      }
    }

    return 'unknown';
  }

  private shouldAuditRead(url: string): boolean {
    // Auditar apenas algumas operações de leitura específicas
    return url.includes('/stats') || url.includes('/:id');
  }

  private shouldLogBody(method: string): boolean {
    // Logar corpo da requisição para operações de criação e atualização
    return ['POST', 'PUT', 'PATCH'].includes(method);
  }

  private shouldLogResult(method: string): boolean {
    // Logar resultado apenas para criação
    return method === 'POST';
  }

  private sanitizeResult(result: unknown): unknown {
    if (Array.isArray(result)) {
      return result.map((item: unknown): unknown =>
        item && typeof item === 'object' && item !== null
          ? this.sanitizeObject(item as Record<string, unknown>)
          : item,
      );
    }
    if (result && typeof result === 'object') {
      return this.sanitizeObject(result as Record<string, unknown>);
    }
    return result;
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...obj };
    delete sanitized.password;
    delete sanitized.fileBuffer;
    return sanitized;
  }
} 