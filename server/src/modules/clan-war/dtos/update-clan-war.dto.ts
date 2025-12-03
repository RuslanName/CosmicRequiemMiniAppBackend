import { IsOptional, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ClanWarStatus } from '../enums/clan-war-status.enum';

export class UpdateClanWarDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  clan_1_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  clan_2_id?: number;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsDateString()
  start_time?: Date;

  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsDateString()
  end_time?: Date;

  @ApiProperty({
    enum: ClanWarStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(ClanWarStatus)
  status?: ClanWarStatus;
}
