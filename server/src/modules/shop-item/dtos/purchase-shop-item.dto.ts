import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseShopItemDto {
  @ApiProperty()
  @IsNumber()
  shop_item_id: number;
}
