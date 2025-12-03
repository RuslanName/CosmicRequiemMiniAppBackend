import { ApiProperty } from '@nestjs/swagger';
import { StolenItemType } from '../../enums/stolen-item-type.enum';
import { UserBasicStatsResponseDto } from '../../../user/dtos/responses/user-with-basic-stats-response.dto';

export class StolenItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: StolenItemType })
  type: StolenItemType;

  @ApiProperty()
  value: string;

  @ApiProperty({
    type: () => UserBasicStatsResponseDto,
    required: false,
    nullable: true,
  })
  thief?: UserBasicStatsResponseDto | null;

  @ApiProperty({
    type: () => UserBasicStatsResponseDto,
    required: false,
    nullable: true,
  })
  victim?: UserBasicStatsResponseDto | null;

  @ApiProperty({ required: false, nullable: true })
  clan_war_id?: number | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
