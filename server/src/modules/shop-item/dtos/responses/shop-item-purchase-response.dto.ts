import { ApiProperty } from '@nestjs/swagger';
import { CurrentUserResponseDto } from '../../../user/dtos/responses/user-me-response.dto';
import { UserGuardResponseDto } from '../../../user-guard/dtos/responses/user-guard-response.dto';
import { UserAccessoryResponseDto } from '../../../user-accessory/dtos/responses/user-accessory-response.dto';
import { UserBoostResponseDto } from '../../../user-boost/dtos/responses/user-boost-response.dto';

export class ShopItemPurchaseResponseDto {
  @ApiProperty({ type: () => CurrentUserResponseDto })
  user: CurrentUserResponseDto;

  @ApiProperty({ type: () => UserGuardResponseDto, required: false })
  created_guard?: UserGuardResponseDto;

  @ApiProperty({ type: [UserGuardResponseDto], required: false })
  created_guards?: UserGuardResponseDto[];

  @ApiProperty({ type: () => UserAccessoryResponseDto, required: false })
  user_accessory?: UserAccessoryResponseDto;

  @ApiProperty({ type: () => UserBoostResponseDto, required: false })
  user_boost?: UserBoostResponseDto;

  @ApiProperty({ required: false })
  shield_cooldown_end?: Date;
}
