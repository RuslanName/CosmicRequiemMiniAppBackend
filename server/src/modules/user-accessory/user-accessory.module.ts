import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccessory } from './user-accessory.entity';
import { UserAccessoryService } from './user-accessory.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserAccessory])],
  providers: [UserAccessoryService],
  exports: [TypeOrmModule, UserAccessoryService],
})
export class UserAccessoryModule {}
