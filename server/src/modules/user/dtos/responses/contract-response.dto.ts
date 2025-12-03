import { ApiProperty } from '@nestjs/swagger';
import { CurrentUserResponseDto } from './user-me-response.dto';

export class UserContractResponseDto {
  @ApiProperty({ type: () => CurrentUserResponseDto })
  user: CurrentUserResponseDto;

  @ApiProperty()
  contract_income: number;

  @ApiProperty()
  contract_cooldown_end: Date;
}
