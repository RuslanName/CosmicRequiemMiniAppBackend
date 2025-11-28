import { ApiProperty } from '@nestjs/swagger';
import { UserMeResponseDto } from '../../../user/dtos/responses/user-me-response.dto';
import { UserGuardResponseDto } from '../../../user-guard/dtos/responses/user-guard-response.dto';
import { UserAccessoryResponseDto } from '../../../user-accessory/dtos/user-accessory-response.dto';
import { UserBoostResponseDto } from '../../../user-boost/dtos/user-boost-response.dto';

export class KitPurchaseResponseDto {
  @ApiProperty({ type: () => UserMeResponseDto })
  user: UserMeResponseDto;

  @ApiProperty({ type: [UserGuardResponseDto] })
  created_guards: UserGuardResponseDto[];

  @ApiProperty({ type: [UserAccessoryResponseDto] })
  user_accessories: UserAccessoryResponseDto[];

  @ApiProperty({ type: [UserBoostResponseDto] })
  user_boosts: UserBoostResponseDto[];
}
