import { IsOptional, IsEnum } from 'class-validator';
import { UserBoostStatus } from '../enums/user-boost-status.enum';

export class UpdateUserBoostDto {
  @IsOptional()
  @IsEnum(UserBoostStatus)
  status?: UserBoostStatus;
}
