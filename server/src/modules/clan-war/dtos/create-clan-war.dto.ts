import { IsNumber, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ClanWarStatus } from '../enums/clan-war-status.enum';

export class CreateClanWarDto {
  @IsNumber()
  clan_1_id: number;

  @IsNumber()
  clan_2_id: number;

  @IsDateString()
  start_time: Date;

  @IsDateString()
  end_time: Date;

  @IsOptional()
  @IsEnum(ClanWarStatus)
  status?: ClanWarStatus;
}
