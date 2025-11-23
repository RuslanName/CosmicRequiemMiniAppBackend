import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;

        if (Array.isArray(responseObj.message)) {
          message = responseObj.message;
        } else if (responseObj.message) {
          message = responseObj.message;
        } else {
          message = exception.message || 'An error occurred';
        }

        error = responseObj.error || exception.name;
      } else {
        message = exception.message || 'An error occurred';
      }

      if (status >= 500) {
        this.logger.error(
          `HTTP ${status} Error: ${JSON.stringify(message)}`,
          exception.stack,
          `${request.method} ${request.path}`,
        );
      }
    } else if (exception instanceof Error) {
      message = exception.message || 'Internal server error';
      error = exception.name;

      this.logger.error(
        `Unhandled Error: ${message}`,
        exception.stack,
        `${request.method} ${request.path}`,
      );
    } else {
      this.logger.error(
        `Unknown Error Type: ${JSON.stringify(exception)}`,
        undefined,
        `${request.method} ${request.path}`,
      );
    }

    const errorResponse: any = {
      statusCode: status,
      message,
    };

    if (status >= 500) {
      errorResponse.timestamp = new Date().toISOString();
      errorResponse.path = request.url;
      errorResponse.method = request.method;
    }

    if (error && error !== message && process.env.NODE_ENV !== 'production') {
      errorResponse.error = error;
    }

    response.status(status).json(errorResponse);
  }
}
