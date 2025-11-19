import { IsOptional, IsString, IsNumber, IsEnum, IsArray } from 'class-validator';
import { ClanStatus } from '../enums/clan-status.enum';

export class UpdateClanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  max_members?: number;


  @IsOptional()
  @IsNumber()
  leader_id?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  member_ids?: number[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  war_ids?: number[];

  @IsOptional()
  @IsString()
  image_path?: string;

  @IsOptional()
  @IsEnum(ClanStatus)
  status?: ClanStatus;
}
