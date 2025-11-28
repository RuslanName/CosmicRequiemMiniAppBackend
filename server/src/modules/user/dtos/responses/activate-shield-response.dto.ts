import { ApiProperty } from '@nestjs/swagger';
import { UserMeResponseDto } from './user-me-response.dto';
import { UserBoostResponseDto } from '../../../user-boost/dtos/user-boost-response.dto';

export class ActivateShieldResponseDto {
  @ApiProperty({ type: () => UserMeResponseDto })
  user: UserMeResponseDto;

  @ApiProperty({ type: () => UserBoostResponseDto })
  user_boost: UserBoostResponseDto;
}
