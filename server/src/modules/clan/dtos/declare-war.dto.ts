import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeclareWarDto {
  @ApiProperty()
  @IsNumber()
  target_clan_id: number;
}
