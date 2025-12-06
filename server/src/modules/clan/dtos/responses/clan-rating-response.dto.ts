import { ApiProperty } from '@nestjs/swagger';

export class ClanRatingResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  image_path: string;

  @ApiProperty({ required: false })
  strength?: number;

  @ApiProperty({ required: false })
  guards_count?: number;

  @ApiProperty({ required: false })
  members_count?: number;

  @ApiProperty()
  vk_group_id: number;
}
