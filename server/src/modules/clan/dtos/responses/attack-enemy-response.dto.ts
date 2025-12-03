import { ApiProperty } from '@nestjs/swagger';

export class ClanAttackEnemyResponseDto {
  @ApiProperty()
  win_chance: number;

  @ApiProperty()
  is_win: boolean;

  @ApiProperty()
  stolen_money: number;

  @ApiProperty()
  captured_guards: number;

  @ApiProperty({ type: [Object] })
  stolen_items: any[];

  @ApiProperty()
  attack_cooldown_end: Date;
}
