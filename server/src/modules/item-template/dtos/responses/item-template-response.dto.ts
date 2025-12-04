import { ApiProperty } from '@nestjs/swagger';
import { ItemTemplateType } from '../../enums/item-template-type.enum';

export class ItemTemplateResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ItemTemplateType })
  type: ItemTemplateType;

  @ApiProperty({ nullable: true })
  value: string | null;

  @ApiProperty({ nullable: true })
  image_path: string | null;

  @ApiProperty({ nullable: true })
  quantity: number | null;

  @ApiProperty({ nullable: true })
  name_in_kit: string | null;
}
