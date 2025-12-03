import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttackPlayerDto {
  @ApiProperty()
  @IsNumber()
  target_user_id: number;
}
