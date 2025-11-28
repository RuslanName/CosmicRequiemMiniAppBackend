import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClanDto {
  @ApiProperty({ example: 'Elite Warriors' })
  @IsString()
  name: string;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  max_members?: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  leader_id: number;

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

  @ApiProperty({
    example: 123456789,
    description: 'ID сообщества VK',
  })
  @IsNumber()
  vk_group_id: number;
}
