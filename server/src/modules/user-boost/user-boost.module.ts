import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBoostController } from './user-boost.controller';
import { UserBoostService } from './user-boost.service';
import { UserBoost } from './user-boost.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserBoost])],
  controllers: [UserBoostController],
  providers: [UserBoostService],
  exports: [UserBoostService, TypeOrmModule],
})
export class UserBoostModule {}
