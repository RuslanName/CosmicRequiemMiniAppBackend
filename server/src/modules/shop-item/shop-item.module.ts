import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopItemController } from './shop-item.controller';
import { ShopItemService } from './shop-item.service';
import { ShopItem } from './shop-item.entity';
import { ItemTemplate } from '../item-template/item-template.entity';
import { User } from '../user/user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { UserAccessory } from '../user-accessory/user-accessory.entity';
import { UserBoost } from '../user-boost/user-boost.entity';
import { UserBoostModule } from '../user-boost/user-boost.module';
import { UserModule } from '../user/user.module';
import { UserAccessoryModule } from '../user-accessory/user-accessory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShopItem,
      ItemTemplate,
      User,
      UserGuard,
      UserAccessory,
      UserBoost,
    ]),
    UserBoostModule,
    UserModule,
    UserAccessoryModule,
  ],
  controllers: [ShopItemController],
  providers: [ShopItemService],
  exports: [ShopItemService],
})
export class ShopItemModule {}
