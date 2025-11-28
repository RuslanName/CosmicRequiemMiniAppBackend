import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserKit } from './user-kit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserKit])],
  exports: [TypeOrmModule],
})
export class UserKitModule {}
