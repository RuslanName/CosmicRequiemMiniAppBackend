import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Notification } from '../notification.entity';

@Injectable()
export class NotificationSchedulerService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  @Cron('0 0 * * *')
  async deleteOldNotifications() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const result = await this.notificationRepository.delete({
      created_at: LessThan(threeDaysAgo),
    });

    console.log(
      `Deleted ${result.affected || 0} notifications older than 3 days`,
    );
  }
}
