import { IsNumber } from 'class-validator';

export class AttackEnemyDto {
  @IsNumber()
  target_user_id: number;
}

