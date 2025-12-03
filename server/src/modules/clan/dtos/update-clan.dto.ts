import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClanDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  max_members?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  leader_id?: number;

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  member_ids?: number[];

  @ApiProperty({ type: [Number], required: false })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  war_ids?: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image_path?: string;
}
