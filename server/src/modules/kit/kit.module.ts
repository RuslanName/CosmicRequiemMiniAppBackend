import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KitController } from './kit.controller';
import { KitService } from './kit.service';
import { Kit } from './kit.entity';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { UserAccessory } from '../user-accessory/user-accessory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Kit, Product, User, UserGuard, UserAccessory])],
  controllers: [KitController],
  providers: [KitService],
  exports: [KitService]
})
export class KitModule {}
