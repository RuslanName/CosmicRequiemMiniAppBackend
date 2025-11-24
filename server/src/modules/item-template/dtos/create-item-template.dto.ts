import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ItemTemplateType } from '../enums/item-template-type.enum';

export class CreateItemTemplateDto {
  @ApiProperty({ example: 'Red Nickname', description: 'Название продукта' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'nickname_color',
    enum: ItemTemplateType,
    description: 'Тип продукта',
  })
  @IsEnum(ItemTemplateType)
  type: ItemTemplateType;

  @ApiProperty({
    example: '#ff0000',
    description: 'Значение продукта (необязательно)',
    required: false,
  })
  @IsOptional()
  @IsString()
  value?: string;
}
