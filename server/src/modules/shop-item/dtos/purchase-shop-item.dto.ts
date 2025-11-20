import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseShopItemDto {
  @ApiProperty({ example: 1, description: 'ID товара магазина' })
  @IsNumber()
  shop_item_id: number;
}
