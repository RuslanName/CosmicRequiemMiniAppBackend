import { ApiProperty } from '@nestjs/swagger';
import { UserBasicStatsResponseDto } from '../../../user/dtos/responses/user-with-basic-stats-response.dto';
import { UserStatsResponseDto } from './user-with-stats-response.dto';

export class ClanDetailResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  image_path: string;

  @ApiProperty()
  strength: number;

  @ApiProperty()
  members_count: number;

  @ApiProperty()
  vk_group_id: number;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  has_active_wars: boolean;

  @ApiProperty({ required: false })
  war_end_time?: string;

  @ApiProperty({ type: () => UserBasicStatsResponseDto })
  leader: UserBasicStatsResponseDto;

  @ApiProperty({ type: [UserStatsResponseDto] })
  members: UserStatsResponseDto[];
}
