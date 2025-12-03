import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class ActivateShieldDto {
  @ApiProperty()
  @IsNumber()
  accessory_id: number;
}
