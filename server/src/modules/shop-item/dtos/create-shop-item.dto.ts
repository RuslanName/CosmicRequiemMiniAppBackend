import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../../../common/enums/currency.enum';
import { ShopItemStatus } from '../enums/shop-item-status.enum';

export class CreateShopItemDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: Currency })
  @IsEnum(Currency)
  currency: Currency;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty({ enum: ShopItemStatus, required: false })
  @IsOptional()
  @IsEnum(ShopItemStatus)
  status?: ShopItemStatus;

  @ApiProperty()
  @IsNumber()
  item_template_id: number;
}
