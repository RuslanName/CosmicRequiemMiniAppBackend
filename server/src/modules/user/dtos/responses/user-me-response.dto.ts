import { ApiProperty } from '@nestjs/swagger';
import { UserAccessoryResponseDto } from '../../../user-accessory/dtos/responses/user-accessory-response.dto';

export class CurrentUserResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  vk_id: number;

  @ApiProperty()
  first_name: string;

  @ApiProperty({ required: false, nullable: true })
  last_name?: string | null;

  @ApiProperty({ required: false, nullable: true })
  image_path?: string | null;

  @ApiProperty()
  money: number;

  @ApiProperty({ required: false, nullable: true })
  shield_end_time?: Date;

  @ApiProperty({ required: false, nullable: true })
  clan_id?: number | null;

  @ApiProperty()
  strength: number;

  @ApiProperty()
  guards_count: number;

  @ApiProperty({ type: [UserAccessoryResponseDto] })
  equipped_accessories: UserAccessoryResponseDto[];

  @ApiProperty({ required: false })
  referral_link?: string;

  @ApiProperty()
  training_cost: number;

  @ApiProperty()
  contract_income: number;

  @ApiProperty()
  referrer_money_reward: number;

  @ApiProperty()
  show_adv: boolean;

  @ApiProperty()
  adv_disable_cost_voices_count: number;

  @ApiProperty()
  referrals_count: number;

  @ApiProperty({ required: false, nullable: true })
  training_end_time?: Date;

  @ApiProperty({ required: false, nullable: true })
  contract_end_time?: Date;

  @ApiProperty({ required: false, nullable: true })
  attack_end_time?: Date;

  @ApiProperty({ required: false, nullable: true })
  users_rating_place?: number | null;

  @ApiProperty({ required: false, nullable: true })
  clans_rating_place?: number | null;
}
