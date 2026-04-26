import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PostgrestError } from '@supabase/supabase-js';
import type { Request, Response } from 'express';
import { friendlyPostgresUniqueMessage } from '../utils/postgres-unique-message';

function isPostgrestError(exception: unknown): exception is PostgrestError {
  return (
    typeof exception === 'object' &&
    exception !== null &&
    'code' in exception &&
    'message' in exception
  );
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno do servidor';
    let details: unknown = undefined;

    if (isPostgrestError(exception)) {
      const mapped = this.handlePostgrestError(exception);
      status = mapped.status;
      message = mapped.message;
      details = mapped.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const raw = (exceptionResponse as { message?: string | string[] }).message;
        const joined = Array.isArray(raw) ? raw.filter(Boolean).join(' ') : raw;
        message =
          (typeof joined === 'string' && joined.length > 0 ? joined : undefined) ||
          exception.message;
        details = exceptionResponse;
      }
      if (
        typeof message === 'string' &&
        message.includes('duplicate key') &&
        message.includes('unique constraint')
      ) {
        message = friendlyPostgresUniqueMessage(message);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Erro não tratado: ${exception.message}`,
        exception.stack,
        `${request.method} ${request.url}`,
      );
    }

    this.logger.error(
      `HTTP ${status} Error: ${message}`,
      exception instanceof Error ? exception.stack : 'No stack trace',
      `${request.method} ${request.url}`,
    );

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(details !== undefined &&
      details !== null &&
      typeof details === 'object' &&
      !Array.isArray(details)
        ? { details }
        : {}),
    };

    response.status(status).json(errorResponse);
  }

  private handlePostgrestError(error: PostgrestError): {
    status: number;
    message: string;
    details?: unknown;
  } {
    if (error.code === '23505') {
      return {
        status: HttpStatus.CONFLICT,
        message: this.uniqueMessageFromPostgrest(error.message),
        details: { code: 'UNIQUE_CONSTRAINT_VIOLATION' },
      };
    }
    if (error.code === '23503') {
      return {
        status: HttpStatus.CONFLICT,
        message: 'Não é possível realizar esta operação. Existem registros relacionados.',
        details: { code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION' },
      };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: `Erro no banco de dados: ${error.message}`,
      details: { code: error.code },
    };
  }

  private uniqueMessageFromPostgrest(msg: string): string {
    if (msg.includes('unique_tenant_license_plate') || msg.includes('licensePlate')) {
      return 'Esta placa já está cadastrada em sua conta. Verifique se não é um veículo existente.';
    }
    if (msg.includes('unique_tenant_chassis') || msg.includes('chassis')) {
      return 'Este chassi já está cadastrado em sua conta. Verifique se não é um veículo existente.';
    }
    return friendlyPostgresUniqueMessage(msg);
  }
}
