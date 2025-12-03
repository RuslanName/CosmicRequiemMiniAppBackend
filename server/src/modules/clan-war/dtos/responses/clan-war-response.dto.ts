import { ApiProperty } from '@nestjs/swagger';
import { ClanWarStatus } from '../../enums/clan-war-status.enum';
import { ClanStatsResponseDto } from '../../../clan/dtos/responses/clan-with-stats-response.dto';
import { StolenItemResponseDto } from './stolen-item-response.dto';

export class ClanWarResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  start_time: Date;

  @ApiProperty()
  end_time: Date;

  @ApiProperty({ enum: ClanWarStatus })
  status: ClanWarStatus;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ type: () => ClanStatsResponseDto })
  clan_1: ClanStatsResponseDto;

  @ApiProperty({ type: () => ClanStatsResponseDto })
  clan_2: ClanStatsResponseDto;

  @ApiProperty({ type: [StolenItemResponseDto], required: false })
  stolen_items?: StolenItemResponseDto[];
}
