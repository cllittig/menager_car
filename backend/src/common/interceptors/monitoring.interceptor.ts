import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../../shared/services/logger.service';

interface RequestMetrics {
  method: string;
  url: string;
  userAgent: string;
  ip: string;
  userId?: string;
  startTime: number;
  endTime: number;
  duration: number;
  statusCode: number;
  responseSize: number;
}

@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  private static requestCount = 0;
  private static errorCount = 0;
  private static totalResponseTime = 0;

  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    MonitoringInterceptor.requestCount++;

    return next.handle().pipe(
      tap({
        next: (result: unknown) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          MonitoringInterceptor.totalResponseTime += duration;
          
          // Calcular responseSize de forma segura
          let responseSize = 0;
          try {
            if (result !== undefined && result !== null) {
              if (Buffer.isBuffer(result)) {
                responseSize = result.length;
              } else if (typeof result === 'string') {
                responseSize = result.length;
              } else if (typeof result === 'object') {
                responseSize = JSON.stringify(result).length;
              }
            }
          } catch {
            responseSize = 0;
          }

          const metrics: RequestMetrics = {
            method: request.method,
            url: request.url,
            userAgent: request.headers['user-agent'] || 'unknown',
            ip: request.realIp || request.ip || 'unknown',
            userId: request.user?.id,
            startTime,
            endTime,
            duration,
            statusCode: response.statusCode,
            responseSize,
          };

          if (duration > 1000) {
            this.logger.warn(
              `Slow request detected: ${request.method} ${request.url} - ${duration}ms | bytes=${metrics.responseSize} | user=${metrics.userId ?? 'n/a'}`,
              'MonitoringInterceptor',
            );
          }

          // Log a cada 100 requests
          if (MonitoringInterceptor.requestCount % 100 === 0) {
            this.logMetricsSummary();
          }
        },
        error: (err: unknown) => {
          MonitoringInterceptor.errorCount++;
          const endTime = Date.now();
          const duration = endTime - startTime;
          const message = err instanceof Error ? err.message : String(err);
          const stack = err instanceof Error ? err.stack : undefined;

          this.logger.error(
            `Request error: ${request.method} ${request.url} - ${duration}ms - ${message}`,
            stack,
            'MonitoringInterceptor',
          );
        },
      }),
    );
  }

  private logMetricsSummary() {
    const avgResponseTime = MonitoringInterceptor.totalResponseTime / MonitoringInterceptor.requestCount;
    const errorRate = (MonitoringInterceptor.errorCount / MonitoringInterceptor.requestCount) * 100;

    this.logger.log(
      `Metrics Summary - Requests: ${MonitoringInterceptor.requestCount}, ` +
      `Errors: ${MonitoringInterceptor.errorCount} (${errorRate.toFixed(2)}%), ` +
      `Avg Response Time: ${avgResponseTime.toFixed(2)}ms`,
      'MonitoringInterceptor'
    );
  }

  // Método estático para obter métricas
  static getMetrics() {
    const avgResponseTime = this.totalResponseTime / this.requestCount || 0;
    const errorRate = (this.errorCount / this.requestCount) * 100 || 0;

    return {
      totalRequests: this.requestCount,
      totalErrors: this.errorCount,
      errorRate: parseFloat(errorRate.toFixed(2)),
      averageResponseTime: parseFloat(avgResponseTime.toFixed(2)),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }

  // Método para reset das métricas
  static resetMetrics() {
    this.requestCount = 0;
    this.errorCount = 0;
    this.totalResponseTime = 0;
  }
} 