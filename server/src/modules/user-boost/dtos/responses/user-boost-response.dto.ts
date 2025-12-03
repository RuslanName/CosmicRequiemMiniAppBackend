import { ApiProperty } from '@nestjs/swagger';
import { UserBoostType } from '../../enums/user-boost-type.enum';

export class UserBoostResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: UserBoostType })
  type: UserBoostType;

  @ApiProperty({ nullable: true })
  end_time?: Date | null;

  @ApiProperty()
  created_at: Date;
}
