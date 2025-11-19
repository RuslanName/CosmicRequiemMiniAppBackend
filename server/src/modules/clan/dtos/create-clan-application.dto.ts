import { IsNumber } from 'class-validator';

export class CreateClanApplicationDto {
  @IsNumber()
  clan_id: number;
}

