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
import { AccessoryModule } from './accessory/accessory.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from '../common/common.module';
import { KitModule } from "./kit/kit.module";
import { ProductModule } from "./product/product.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
    AccessoryModule,
    AuthModule,
    ClanModule,
    ClanWarModule,
    KitModule,
    ProductModule,
    SettingModule,
    UserModule,
    UserGuardModule,
  ],
})
export class AppModule {}