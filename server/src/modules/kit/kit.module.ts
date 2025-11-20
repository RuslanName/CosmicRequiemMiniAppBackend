import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KitController } from './kit.controller';
import { KitService } from './kit.service';
import { Kit } from './kit.entity';
import { ItemTemplate } from '../item-template/item-template.entity';
import { User } from '../user/user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { UserAccessory } from '../user-accessory/user-accessory.entity';
import { UserBoost } from '../user-boost/user-boost.entity';
import { UserBoostModule } from '../user-boost/user-boost.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Kit,
      ItemTemplate,
      User,
      UserGuard,
      UserAccessory,
      UserBoost,
    ]),
    UserBoostModule,
  ],
  controllers: [KitController],
  providers: [KitService],
  exports: [KitService],
})
export class KitModule {}
