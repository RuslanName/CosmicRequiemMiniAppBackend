import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class VKPaymentsExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let errorCode = 100;
    let errorMsg = 'Internal server error';
    const httpStatus = HttpStatus.OK;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (status === HttpStatus.NOT_FOUND) {
        errorCode = 100;
      } else if (status === HttpStatus.BAD_REQUEST) {
        errorCode = 1;
      } else if (status === HttpStatus.UNAUTHORIZED) {
        errorCode = 2;
      } else {
        errorCode = 100;
      }

      if (typeof exceptionResponse === 'string') {
        errorMsg = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as any;
        if (Array.isArray(responseObj.message)) {
          errorMsg = responseObj.message.join(', ');
        } else if (responseObj.message) {
          errorMsg = responseObj.message;
        } else {
          errorMsg = exception.message || 'An error occurred';
        }
      } else {
        errorMsg = exception.message || 'An error occurred';
      }
    } else if (exception instanceof Error) {
      errorMsg = exception.message || 'Internal server error';
    }

    response.status(httpStatus).json({
      error: {
        error_code: errorCode,
        error_msg: errorMsg,
      },
    });
  }
}

