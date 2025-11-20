import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseKitDto {
  @ApiProperty({ example: 1, description: 'ID набора' })
  @IsNumber()
  kit_id: number;
}
