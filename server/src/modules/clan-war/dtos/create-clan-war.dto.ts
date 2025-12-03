import { IsNumber, IsDateString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ClanWarStatus } from '../enums/clan-war-status.enum';

export class CreateClanWarDto {
  @ApiProperty()
  @IsNumber()
  clan_1_id: number;

  @ApiProperty()
  @IsNumber()
  clan_2_id: number;

  @ApiProperty()
  @IsDateString()
  start_time: Date;

  @ApiProperty()
  @IsDateString()
  end_time: Date;

  @ApiProperty({
    enum: ClanWarStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ClanWarStatus)
  status?: ClanWarStatus;
}
