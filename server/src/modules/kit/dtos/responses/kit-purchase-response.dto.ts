import { ApiProperty } from '@nestjs/swagger';
import { CurrentUserResponseDto } from '../../../user/dtos/responses/user-me-response.dto';
import { UserGuardResponseDto } from '../../../user-guard/dtos/responses/user-guard-response.dto';
import { UserAccessoryResponseDto } from '../../../user-accessory/dtos/responses/user-accessory-response.dto';
import { UserBoostResponseDto } from '../../../user-boost/dtos/responses/user-boost-response.dto';

export class KitPurchaseResponseDto {
  @ApiProperty({ type: () => CurrentUserResponseDto })
  user: CurrentUserResponseDto;

  @ApiProperty({ type: [UserGuardResponseDto] })
  created_guards: UserGuardResponseDto[];

  @ApiProperty({ type: [UserAccessoryResponseDto] })
  user_accessories: UserAccessoryResponseDto[];

  @ApiProperty({ type: [UserBoostResponseDto] })
  user_boosts: UserBoostResponseDto[];
}
