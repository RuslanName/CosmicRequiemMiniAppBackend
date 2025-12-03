import { IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserBoostType } from '../enums/user-boost-type.enum';

export class CreateUserBoostDto {
  @ApiProperty({
    enum: UserBoostType,
  })
  @IsEnum(UserBoostType)
  type: UserBoostType;

  @ApiProperty()
  @IsNumber()
  user_id: number;
}
