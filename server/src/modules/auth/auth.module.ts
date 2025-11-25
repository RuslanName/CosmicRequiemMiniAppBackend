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
import { ENV } from '../../config/constants';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserGuard, Admin, Clan, ClanApplication]),
    TaskModule,
    PassportModule,
    JwtModule.register({
      secret: ENV.JWT_SECRET,
      signOptions: { expiresIn: ENV.JWT_EXPIRES_IN as any },
      global: true,
    }),
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [AuthService, AdminAuthService, JwtStrategy, AdminJwtStrategy],
  exports: [JwtModule, AdminAuthService],
})
export class AuthModule {}
