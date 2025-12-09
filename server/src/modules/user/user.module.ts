import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { StolenItem } from '../clan-war/entities/stolen-item.entity';
import { ClanWar } from '../clan-war/entities/clan-war.entity';
import { UserBoostModule } from '../user-boost/user-boost.module';
import { UserAccessoryModule } from '../user-accessory/user-accessory.module';
import { EventHistoryModule } from '../event-history/event-history.module';
import { TaskModule } from '../task/task.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserGuard, StolenItem, ClanWar]),
    UserBoostModule,
    forwardRef(() => UserAccessoryModule),
    EventHistoryModule,
    TaskModule,
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
