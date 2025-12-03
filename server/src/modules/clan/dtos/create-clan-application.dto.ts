import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClanApplicationDto {
  @ApiProperty()
  @IsNumber()
  clan_id: number;
}
