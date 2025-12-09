import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AuthService } from './services/auth.service';
import { AdminAuthService } from './services/admin-auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { Admin } from '../admin/admin.entity';
import { Clan } from '../clan/entities/clan.entity';
import { ClanApplication } from '../clan/entities/clan-application.entity';
import { AdminRefreshToken } from './entities/admin-refresh-token.entity';
import { Session } from './entities/session.entity';
import { ENV } from '../../config/constants';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { SessionService } from './services/session.service';
import { VKSessionGuard } from './guards/vk-session.guard';
import { SessionCookieInterceptor } from './interceptors/session-cookie.interceptor';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      UserGuard,
      Admin,
      Clan,
      ClanApplication,
      AdminRefreshToken,
      Session,
    ]),
    TaskModule,
    PassportModule,
    JwtModule.register({
      secret: ENV.JWT_ADMIN_ACCESS_SECRET,
      signOptions: { expiresIn: ENV.JWT_ADMIN_ACCESS_EXPIRES_IN as any },
      global: true,
    }),
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [
    AuthService,
    AdminAuthService,
    AdminJwtStrategy,
    SessionService,
    VKSessionGuard,
    SessionCookieInterceptor,
  ],
  exports: [
    JwtModule,
    AdminAuthService,
    SessionService,
    VKSessionGuard,
    SessionCookieInterceptor,
  ],
})
export class AuthModule {}
