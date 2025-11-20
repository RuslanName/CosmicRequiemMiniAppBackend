import { IsEnum, IsNumber } from 'class-validator';
import { UserBoostType } from '../enums/user-boost-type.enum';

export class CreateUserBoostDto {
  @IsEnum(UserBoostType)
  type: UserBoostType;

  @IsNumber()
  user_id: number;
}
