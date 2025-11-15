import { IsNumber } from 'class-validator';

export class DeclareWarDto {
  @IsNumber()
  target_clan_id: number;
}

