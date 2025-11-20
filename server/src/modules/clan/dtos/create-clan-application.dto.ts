import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClanApplicationDto {
  @ApiProperty({ example: 1, description: 'ID клана' })
  @IsNumber()
  clan_id: number;
}
