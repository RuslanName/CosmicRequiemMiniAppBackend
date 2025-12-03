import { ApiProperty } from '@nestjs/swagger';
import { CurrentUserResponseDto } from './user-me-response.dto';

export class UserTrainingResponseDto {
  @ApiProperty({ type: () => CurrentUserResponseDto })
  user: CurrentUserResponseDto;

  @ApiProperty()
  training_cost: number;

  @ApiProperty()
  power_increase: number;

  @ApiProperty()
  new_power: number;

  @ApiProperty()
  training_cooldown_end: Date;
}
