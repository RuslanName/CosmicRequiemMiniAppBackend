import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';
import { UserGuard } from '../user-guard/user-guard.entity';
import { UserBoostModule } from '../user-boost/user-boost.module';
import { UserAccessoryModule } from '../user-accessory/user-accessory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserGuard]),
    UserBoostModule,
    UserAccessoryModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
