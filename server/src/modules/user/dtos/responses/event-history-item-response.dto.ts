import { ApiProperty } from '@nestjs/swagger';
import { EventHistoryType } from '../../../event-history/enums/event-history-type.enum';
import { UserAccessoryResponseDto } from '../../../user-accessory/dtos/user-accessory-response.dto';

export class EventHistoryItemResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: EventHistoryType })
  type: EventHistoryType;

  @ApiProperty()
  user_id: number;

  @ApiProperty({ required: false, nullable: true })
  opponent_id: number | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  strength: number;

  @ApiProperty()
  money: number;

  @ApiProperty()
  guards_count: number;

  @ApiProperty({ type: [UserAccessoryResponseDto], required: false, nullable: true })
  opponent_equipped_accessories?: UserAccessoryResponseDto[] | null;
}
