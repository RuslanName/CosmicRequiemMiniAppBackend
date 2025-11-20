import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from '@nestjs-modules/ioredis';
import { postgresConfig } from '../config/postgres.config';
import { redisConfig } from '../config/redis.config';
import { UserModule } from './user/user.module';
import { UserGuardModule } from './user-guard/user-guard.module';
import { ClanModule } from './clan/clan.module';
import { SettingModule } from './setting/setting.module';
import { ClanWarModule } from './clan-war/clan-war.module';
import { ShopItemModule } from './shop-item/shop-item.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from '../common/common.module';
import { KitModule } from './kit/kit.module';
import { ItemTemplateModule } from './item-template/item-template.module';
import { AdminModule } from './admin/admin.module';
import { UserBoostModule } from './user-boost/user-boost.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '..env',
    }),

    ScheduleModule.forRoot(),

    TypeOrmModule.forRoot(postgresConfig),

    RedisModule.forRoot({
      type: 'single',
      url: redisConfig.password
        ? `redis://:${redisConfig.password}@${redisConfig.host}:${redisConfig.port}`
        : `redis://${redisConfig.host}:${redisConfig.port}`,
      options: {
        password: redisConfig.password || undefined,
      },
    }),

    CommonModule,
    ShopItemModule,
    AuthModule,
    AdminModule,
    ClanModule,
    ClanWarModule,
    KitModule,
    ItemTemplateModule,
    SettingModule,
    UserModule,
    UserGuardModule,
    UserBoostModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
