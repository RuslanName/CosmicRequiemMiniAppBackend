import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeclareWarDto {
  @ApiProperty({ example: 2, description: 'ID целевого клана' })
  @IsNumber()
  target_clan_id: number;
}
