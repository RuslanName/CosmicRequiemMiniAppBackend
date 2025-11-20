import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ClanStatus } from '../enums/clan-status.enum';

export class UpdateClanDto {
  @ApiProperty({ example: 'Elite Warriors', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  max_members?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  leader_id?: number;

  @ApiProperty({ example: [1, 2, 3], type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  member_ids?: number[];

  @ApiProperty({ example: [1, 2], type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  war_ids?: number[];

  @ApiProperty({ example: 'data/clan-images/clan-123.jpg', required: false })
  @IsOptional()
  @IsString()
  image_path?: string;

  @ApiProperty({ example: 'active', enum: ClanStatus, required: false })
  @IsOptional()
  @IsEnum(ClanStatus)
  status?: ClanStatus;
}
