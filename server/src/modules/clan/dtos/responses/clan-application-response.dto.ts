import { ApiProperty } from '@nestjs/swagger';
import { ClanApplicationStatus } from '../../enums/clan-application.enum';
import { UserBasicStatsResponseDto } from '../../../user/dtos/responses/user-with-basic-stats-response.dto';
import { ClanStatsResponseDto } from './clan-with-stats-response.dto';

export class ClanApplicationResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: () => UserBasicStatsResponseDto, required: false })
  user?: UserBasicStatsResponseDto;

  @ApiProperty()
  created_at: Date;
}

