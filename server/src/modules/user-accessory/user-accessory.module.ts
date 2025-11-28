import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccessory } from './user-accessory.entity';
import { UserAccessoryService } from './user-accessory.service';
import { User } from '../user/user.entity';
import { UserBoost } from '../user-boost/user-boost.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAccessory, User, UserBoost]),
    forwardRef(() => UserModule),
  ],
  providers: [UserAccessoryService],
  exports: [TypeOrmModule, UserAccessoryService],
})
export class UserAccessoryModule {}
