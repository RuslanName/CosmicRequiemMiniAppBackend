import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAccessory } from './user-accessory.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserAccessory])],
  exports: [TypeOrmModule],
})
export class UserAccessoryModule {}

