import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { reloadSettings } from '../../../config/setting.config';

@Injectable()
export class SettingSchedulerService {
  @Cron('0 */5 * * * *')
  async reloadSettingsCron() {
    await reloadSettings();
  }
}
