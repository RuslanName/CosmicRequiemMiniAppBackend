import { IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ClanWarStatus } from '../enums/clan-war-status.enum';

export class UpdateClanWarDto {
  @IsOptional()
  @IsNumber()
  clan_1_id?: number;

  @IsOptional()
  @IsNumber()
  clan_2_id?: number;

  @IsOptional()
  @IsDateString()
  start_time?: Date;

  @IsOptional()
  @IsDateString()
  end_time?: Date;

  @IsOptional()
  @IsEnum(ClanWarStatus)
  status?: ClanWarStatus;
}
