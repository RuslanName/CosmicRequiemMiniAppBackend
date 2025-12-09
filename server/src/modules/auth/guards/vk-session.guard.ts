import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { ENV } from '../../../config/constants';

@Injectable()
export class VKSessionGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

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

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = this.extractSessionId(request);

    if (!sessionId) {
      throw new UnauthorizedException('Сессия не найдена');
    }

    const expiresInSeconds = this.parseExpiresIn(ENV.SESSION_EXPIRES_IN);
    const sessionData = await this.sessionService.validateSession(
      sessionId,
      expiresInSeconds,
    );

    if (!sessionData) {
      throw new UnauthorizedException('Сессия недействительна или истекла');
    }

    request.user = { id: sessionData.userId };
    // Сохраняем информацию о продлении сессии для interceptor
    request.sessionExtended = sessionData.shouldExtend;
    request.sessionId = sessionId;
    request.sessionExpiresIn = expiresInSeconds;

    return true;
  }

  private extractSessionId(request: any): string | null {
    if (request.headers['x-session-id']) {
      return request.headers['x-session-id'];
    }

    if (request.cookies && request.cookies['session_id']) {
      return request.cookies['session_id'];
    }

    if (request.headers['cookie']) {
      const cookies = request.headers['cookie'].split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'session_id') {
          return value;
        }
      }
    }

    return null;
  }
}
