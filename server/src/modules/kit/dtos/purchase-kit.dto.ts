import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseKitDto {
  @ApiProperty()
  @IsNumber()
  kit_id: number;
}
