import { ApiProperty } from '@nestjs/swagger';
import { UserAccessoryResponseDto } from '../../../user-accessory/dtos/user-accessory-response.dto';

export class UserWithBasicStatsResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  vk_id: number;

  @ApiProperty()
  first_name: string;

  @ApiProperty({ required: false, nullable: true })
  last_name?: string | null;

  @ApiProperty()
  sex: number;

  @ApiProperty({ required: false, nullable: true })
  image_path?: string | null;

  @ApiProperty({ required: false, nullable: true })
  birthday_date?: string | null;

  @ApiProperty()
  money: number;

  @ApiProperty({ required: false, nullable: true })
  shield_end_time?: Date;

  @ApiProperty({ required: false, nullable: true })
  last_training_time?: Date;

  @ApiProperty({ required: false, nullable: true })
  last_contract_time?: Date;

  @ApiProperty({ required: false, nullable: true })
  last_attack_time?: Date;

  @ApiProperty({ required: false, nullable: true })
  clan_leave_time?: Date;

  @ApiProperty()
  status: string;

  @ApiProperty()
  registered_at: Date;

  @ApiProperty()
  last_login_at: Date;

  @ApiProperty({ required: false, nullable: true })
  clan_id?: number | null;

  @ApiProperty()
  strength: number;

  @ApiProperty()
  guards_count: number;

  @ApiProperty({ required: false })
  referral_link?: string;

  @ApiProperty({
    type: [UserAccessoryResponseDto],
    required: false,
    nullable: true,
  })
  equipped_accessories?: UserAccessoryResponseDto[] | null;
}
