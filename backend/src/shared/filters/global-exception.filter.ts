import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Global Exception Filter - Prevents leaking sensitive error details
 * Logs full errors internally, returns sanitized errors to clients
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'InternalServerError';

    // Handle NestJS HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || error;
      }
    }
    // Handle Prisma errors (without leaking DB structure)
    else if (exception instanceof Error) {
      this.logger.error(
        `Unexpected error: ${exception.message}`,
        exception.stack,
      );

      // Don't leak database errors to client
      if (exception.name.includes('Prisma')) {
        message = 'Database operation failed';
        error = 'DatabaseError';
      } else {
        // In production, hide error details
        if (process.env.NODE_ENV === 'production') {
          message = 'An unexpected error occurred';
        } else {
          message = exception.message;
        }
      }
    }

    // Log all errors for monitoring
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    // Send sanitized response
    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      // Only include stack trace in development
      ...(process.env.NODE_ENV !== 'production' &&
        exception instanceof Error && { stack: exception.stack }),
    });
  }
}
