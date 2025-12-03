import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ItemTemplateType } from '../enums/item-template-type.enum';

export class CreateItemTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({
    enum: ItemTemplateType,
  })
  @IsEnum(ItemTemplateType)
  type: ItemTemplateType;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  name_in_kit?: string;
}
