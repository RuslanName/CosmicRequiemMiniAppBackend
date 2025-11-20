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
  @ApiProperty({ example: 'Иван', required: false })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ example: 'Иванов', required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsNumber()
  sex?: number;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiProperty({ example: '01.01.2000', required: false })
  @IsOptional()
  @IsString()
  birthday_date?: string;

  @ApiProperty({ example: 10000, required: false })
  @IsOptional()
  @IsNumber()
  money?: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  shield_end_time?: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  last_shield_purchase_time?: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  last_contract_time?: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  clan_leave_time?: Date;

  @ApiProperty({ example: 'active', enum: UserStatus, required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  last_login_at?: Date;
}
