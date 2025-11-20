import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingController } from './setting.controller';
import { SettingService } from './services/setting.service';
import { SettingSchedulerService } from './services/setting-scheduler.service';
import { Setting } from './setting.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  controllers: [SettingController],
  providers: [SettingService, SettingSchedulerService],
  exports: [SettingService],
})
export class SettingModule {}
