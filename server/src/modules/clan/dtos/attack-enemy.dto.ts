import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttackEnemyDto {
  @ApiProperty({ example: 5, description: 'ID целевого пользователя' })
  @IsNumber()
  target_user_id: number;
}
