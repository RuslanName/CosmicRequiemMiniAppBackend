import { IsOptional, IsString, IsNumber, IsEnum, IsDateString } from 'class-validator';
import { UserStatus } from '../enums/user-status.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsNumber()
  sex?: number;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @IsString()
  birthday_date?: string;

  @IsOptional()
  @IsNumber()
  money?: number;

  @IsOptional()
  @IsDateString()
  shield_end_time?: Date;

  @IsOptional()
  @IsDateString()
  last_shield_purchase_time?: Date;

  @IsOptional()
  @IsDateString()
  last_contract_time?: Date;

  @IsOptional()
  @IsDateString()
  clan_leave_time?: Date;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsDateString()
  last_login_at?: Date;
}