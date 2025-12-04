import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../../../../common/enums/currency.enum';
import { ShopItemStatus } from '../../enums/shop-item-status.enum';
import { ItemTemplateResponseDto } from '../../../item-template/dtos/responses/item-template-response.dto';

export class ShopItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty()
  price: number;

  @ApiProperty({ enum: ShopItemStatus })
  status: ShopItemStatus;

  @ApiProperty()
  item_template_id: number;

  @ApiProperty({ type: () => ItemTemplateResponseDto, required: false })
  item_template?: ItemTemplateResponseDto;
}
