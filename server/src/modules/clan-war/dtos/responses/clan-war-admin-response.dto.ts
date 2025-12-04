import { ApiProperty } from '@nestjs/swagger';
import { ClanWarStatus } from '../../enums/clan-war-status.enum';

export class ClanWarAdminResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  start_time: Date;

  @ApiProperty()
  end_time: Date;

  @ApiProperty({ enum: ClanWarStatus })
  status: ClanWarStatus;

  @ApiProperty()
  clan_1_id: number;

  @ApiProperty()
  clan_2_id: number;
}
