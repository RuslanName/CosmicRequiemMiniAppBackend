import { ApiProperty } from '@nestjs/swagger';

export class ClanStatsResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  max_members: number;

  @ApiProperty()
  image_path: string;

  @ApiProperty({ required: false, nullable: true })
  leader_id?: number | null;

  @ApiProperty({ required: false })
  money?: number;

  @ApiProperty({ required: false })
  strength?: number;

  @ApiProperty({ required: false })
  guards_count?: number;

  @ApiProperty({ required: false })
  members_count?: number;

  @ApiProperty({ required: false })
  wars_count?: number;
}
