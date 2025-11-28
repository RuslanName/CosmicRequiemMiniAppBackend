import {
  IsString,
  IsNumber,
  IsArray,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../../../common/enums/currency.enum';
import { ShopItemStatus } from '../../shop-item/enums/shop-item-status.enum';

export class CreateKitDto {
  @ApiProperty({ example: 'Премиум набор' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'virtual', enum: Currency })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 1000, required: false })
  @IsOptional()
  @IsNumber()
  money?: number;

  @ApiProperty({ example: 'in_stock', enum: ShopItemStatus, required: false })
  @IsOptional()
  @IsEnum(ShopItemStatus)
  status?: ShopItemStatus;

  @ApiProperty({ example: [1, 2, 3], type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  item_template_ids: number[];
}
