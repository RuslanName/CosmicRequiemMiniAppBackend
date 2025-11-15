import { IsString, IsNumber, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ClanStatus } from '../enums/clan-status.enum';

export class CreateClanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  max_members?: number;


  @IsNumber()
  leader_id: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  member_ids?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  war_ids?: number[];

  @IsOptional()
  @IsEnum(ClanStatus)
  status?: ClanStatus;
}
