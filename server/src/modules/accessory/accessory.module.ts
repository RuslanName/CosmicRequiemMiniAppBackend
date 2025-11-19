import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessoryController } from './accessory.controller';
import { AccessoryService } from './accessory.service';
import { Accessory } from './accessory.entity';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { UserAccessory } from '../user-accessory/user-accessory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Accessory, Product, User, UserGuard, UserAccessory])],
  controllers: [AccessoryController],
  providers: [AccessoryService],
  exports: [AccessoryService]
})
export class AccessoryModule {}
