import { ApiProperty } from '@nestjs/swagger';
import { ShopItem } from '../../shop-item.entity';

export class ShopItemWithoutTemplate {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  image_path: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class ShopItemsListResponseDto {
  @ApiProperty({ type: [ShopItemWithoutTemplate] })
  categories: Record<string, ShopItemWithoutTemplate[]>;
}
