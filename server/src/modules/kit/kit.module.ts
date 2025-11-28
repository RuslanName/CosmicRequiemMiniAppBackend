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
import { UserKit } from '../user-kit/user-kit.entity';
import { UserModule } from '../user/user.module';
import { UserAccessoryModule } from '../user-accessory/user-accessory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Kit,
      ItemTemplate,
      User,
      UserGuard,
      UserAccessory,
      UserBoost,
      UserKit,
    ]),
    UserBoostModule,
    UserModule,
    UserAccessoryModule,
  ],
  controllers: [KitController],
  providers: [KitService],
  exports: [KitService],
})
export class KitModule {}
