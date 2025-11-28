import { ApiProperty } from '@nestjs/swagger';

export class LeaderResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  vk_id: number;

  @ApiProperty()
  first_name: string;

  @ApiProperty({ required: false, nullable: true })
  last_name?: string | null;

  @ApiProperty({ required: false, nullable: true })
  image_path?: string | null;
}
