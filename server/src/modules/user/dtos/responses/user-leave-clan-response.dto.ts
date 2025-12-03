import { ApiProperty } from '@nestjs/swagger';
import { UserBasicStatsResponseDto } from './user-with-basic-stats-response.dto';

export class LeaveClanResponseDto {
  @ApiProperty({ type: () => UserBasicStatsResponseDto })
  user: UserBasicStatsResponseDto;
}

