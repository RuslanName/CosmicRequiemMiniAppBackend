import { ApiProperty } from '@nestjs/swagger';
import { ClanWarStatus } from '../../enums/clan-war-status.enum';
import { ClanWithStatsResponseDto } from '../../../clan/dtos/responses/clan-with-stats-response.dto';
import { StolenItem } from '../../entities/stolen-item.entity';

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

  @ApiProperty({ type: () => ClanWithStatsResponseDto })
  clan_1: ClanWithStatsResponseDto;

  @ApiProperty({ type: () => ClanWithStatsResponseDto })
  clan_2: ClanWithStatsResponseDto;

  @ApiProperty({ type: [StolenItem], required: false })
  stolen_items?: StolenItem[];
}

