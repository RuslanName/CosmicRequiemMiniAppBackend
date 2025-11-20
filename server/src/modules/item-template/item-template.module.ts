import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemTemplate } from './item-template.entity';
import { ItemTemplateController } from './item-template.controller';
import { ItemTemplateService } from './item-template.service';

@Module({
  imports: [TypeOrmModule.forFeature([ItemTemplate])],
  controllers: [ItemTemplateController],
  providers: [ItemTemplateService],
  exports: [ItemTemplateService, TypeOrmModule],
})
export class ItemTemplateModule {}
