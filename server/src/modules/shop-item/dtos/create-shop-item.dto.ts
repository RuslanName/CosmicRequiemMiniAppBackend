import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../../../common/enums/currency.enum';
import { ShopItemStatus } from '../enums/shop-item-status.enum';

export class CreateShopItemDto {
  @ApiProperty({ example: 'virtual', enum: Currency })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  price: number;

  @ApiProperty({ example: 'in_stock', enum: ShopItemStatus, required: false })
  @IsOptional()
  @IsEnum(ShopItemStatus)
  status?: ShopItemStatus;

  @ApiProperty({ example: 1 })
  @IsNumber()
  item_template_id: number;
}
