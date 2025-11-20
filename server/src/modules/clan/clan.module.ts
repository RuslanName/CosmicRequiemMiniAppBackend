import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClanController } from './clan.controller';
import { ClanService } from './clan.service';
import { Clan } from './entities/clan.entity';
import { ClanWar } from '../clan-war/entities/clan-war.entity';
import { User } from '../user/user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { StolenItem } from '../clan-war/entities/stolen-item.entity';
import { ClanApplication } from './entities/clan-application.entity';
import { UserBoostModule } from '../user-boost/user-boost.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Clan,
      ClanWar,
      User,
      UserGuard,
      StolenItem,
      ClanApplication,
    ]),
    UserBoostModule,
  ],
  controllers: [ClanController],
  providers: [ClanService],
  exports: [ClanService],
})
export class ClanModule {}
