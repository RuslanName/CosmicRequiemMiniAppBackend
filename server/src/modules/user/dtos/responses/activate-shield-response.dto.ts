import { ApiProperty } from '@nestjs/swagger';
import { CurrentUserResponseDto } from './user-me-response.dto';
import { UserBoostResponseDto } from '../../../user-boost/dtos/responses/user-boost-response.dto';

export class ShieldActivateResponseDto {
  @ApiProperty({ type: () => CurrentUserResponseDto })
  user: CurrentUserResponseDto;

  @ApiProperty({ type: () => UserBoostResponseDto })
  user_boost: UserBoostResponseDto;
}
