import { ApiProperty } from '@nestjs/swagger';
import { ShopItem } from '../../shop-item.entity';
import { Currency } from '../../../../common/enums/currency.enum';

export class ShopItemWithoutTemplate {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty()
  image_path: string;

  @ApiProperty({ required: false, nullable: true })
  value: string | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class ShopItemsListResponseDto {
  @ApiProperty({ type: [ShopItemWithoutTemplate] })
  categories: Record<string, ShopItemWithoutTemplate[]>;
}
