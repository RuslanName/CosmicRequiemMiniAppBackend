import { IsOptional, IsString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ItemTemplateType } from '../enums/item-template-type.enum';

export class UpdateItemTemplateDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    enum: ItemTemplateType,
    required: false,
  })
  @IsOptional()
  @IsEnum(ItemTemplateType)
  type?: ItemTemplateType;

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

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  image_path?: string;
}
