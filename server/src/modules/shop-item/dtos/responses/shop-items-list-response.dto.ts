import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '../../../../common/enums/currency.enum';

export class ShopItemWithoutTemplate {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty({ enum: Currency })
  currency: Currency;

  @ApiProperty()
  image_path: string;

  @ApiProperty({ required: false, nullable: true })
  value: string | null;

  @ApiProperty({ required: false, nullable: true })
  quantity: number | null;
}

export class ShopItemsCategoryResponseDto {
  @ApiProperty({ type: [ShopItemWithoutTemplate] })
  data: ShopItemWithoutTemplate[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class ShopItemsListResponseDto {
  @ApiProperty({ type: ShopItemsCategoryResponseDto })
  categories: Record<string, ShopItemsCategoryResponseDto>;
}
