import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Giveaway } from './giveaway.entity';
import { GiveawayController } from './giveaway.controller';
import { GiveawayService } from './giveaway.service';

@Module({
  imports: [TypeOrmModule.forFeature([Giveaway])],
  controllers: [GiveawayController],
  providers: [GiveawayService],
  exports: [GiveawayService],
})
export class GiveawayModule {}
