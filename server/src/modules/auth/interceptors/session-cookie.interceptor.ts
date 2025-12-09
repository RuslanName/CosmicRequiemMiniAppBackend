import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';
import { ENV } from '../../../config/constants';

@Injectable()
export class SessionCookieInterceptor implements NestInterceptor {
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 30 * 24 * 60 * 60;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 30 * 24 * 60 * 60;
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        if (request.sessionExtended && request.sessionId) {
          const expiresInSeconds =
            request.sessionExpiresIn ||
            this.parseExpiresIn(ENV.SESSION_EXPIRES_IN);
          response.cookie('session_id', request.sessionId, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: expiresInSeconds * 1000,
            path: '/',
          });
        }
      }),
    );
  }
}
