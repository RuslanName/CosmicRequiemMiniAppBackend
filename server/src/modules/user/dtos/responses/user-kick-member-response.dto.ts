import { ApiProperty } from '@nestjs/swagger';
import { UserBasicStatsResponseDto } from './user-with-basic-stats-response.dto';

export class KickMemberResponseDto {
  @ApiProperty({ type: () => UserBasicStatsResponseDto })
  user: UserBasicStatsResponseDto;
}

