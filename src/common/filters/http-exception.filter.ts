import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly isProduction: boolean;

  constructor(
    nodeEnv = 'development',
    private readonly logger: Pick<Logger, 'error'> = new Logger(
      HttpExceptionFilter.name,
    ),
  ) {
    this.isProduction = nodeEnv === 'production';
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logServerError(exception, request, status);
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      error: this.getSafeErrorResponse(status, exceptionResponse),
    });
  }

  private getSafeErrorResponse(
    status: number,
    exceptionResponse: string | object | null,
  ) {
    if (!this.isProduction || status < HttpStatus.INTERNAL_SERVER_ERROR) {
      return exceptionResponse;
    }

    return {
      statusCode: status,
      message: 'Internal server error',
      error: 'Internal Server Error',
    };
  }

  private logServerError(
    exception: unknown,
    request: Request,
    status: number,
  ) {
    const path = request.path || request.url.split('?')[0] || request.url;
    const exceptionName =
      exception instanceof Error ? exception.name : typeof exception;
    const exceptionMessage =
      exception instanceof Error
        ? this.sanitizeLogMessage(exception.message)
        : 'Unknown error';

    this.logger.error(
      `Request failed: ${request.method} ${path} status=${status} exception=${exceptionName} message=${exceptionMessage}`,
    );
  }

  private sanitizeLogMessage(message: string) {
    return message
      .replace(/bearer\s+[^\s]+/gi, 'Bearer [redacted]')
      .replace(
        /(client_id|client_secret|password|token|secret)=([^&\s]+)/gi,
        '$1=[redacted]',
      )
      .replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted-database-url]')
      .replace(/https?:\/\/\S+/gi, (rawUrl) => {
        try {
          const parsedUrl = new URL(rawUrl);
          return `${parsedUrl.origin}${parsedUrl.pathname}`;
        } catch {
          return '[redacted-url]';
        }
      });
  }
}
