import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EquipAccessoryDto {
  @ApiProperty()
  @IsNumber()
  accessory_id: number;
}
