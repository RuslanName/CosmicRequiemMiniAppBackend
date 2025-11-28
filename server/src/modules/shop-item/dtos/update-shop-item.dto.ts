import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../../../common/enums/currency.enum';
import { ShopItemStatus } from '../enums/shop-item-status.enum';

export class UpdateShopItemDto {
  @ApiProperty({ example: 'virtual', enum: Currency, required: false })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({ example: 1000, required: false })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ example: 'in_stock', enum: ShopItemStatus, required: false })
  @IsOptional()
  @IsEnum(ShopItemStatus)
  status?: ShopItemStatus;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  item_template_id?: number;
}
