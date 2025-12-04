import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../../../../common/enums/currency.enum';
import { ShopItemStatus } from '../../../shop-item/enums/shop-item-status.enum';
import { ItemTemplateResponseDto } from '../../../item-template/dtos/responses/item-template-response.dto';

export class KitResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty()
  price: number;

  @ApiProperty()
  money: number;

  @ApiProperty({ enum: ShopItemStatus })
  status: ShopItemStatus;

  @ApiProperty({ type: [ItemTemplateResponseDto], required: false })
  item_templates?: ItemTemplateResponseDto[];
}
