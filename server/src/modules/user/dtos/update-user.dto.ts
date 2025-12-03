import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../enums/user-status.enum';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sex?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  birthday_date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  money?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  last_contract_time?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  clan_leave_time?: Date;

  @ApiProperty({ enum: UserStatus, required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  last_login_at?: Date;
}
