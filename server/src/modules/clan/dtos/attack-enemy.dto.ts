import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttackEnemyDto {
  @ApiProperty()
  @IsNumber()
  target_user_id: number;
}
