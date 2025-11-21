import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EquipAccessoryDto {
  @ApiProperty({ example: 1, description: 'ID аксессуара' })
  @IsNumber()
  accessory_id: number;
}
