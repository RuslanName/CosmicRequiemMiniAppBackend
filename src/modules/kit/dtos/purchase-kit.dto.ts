import { IsNumber } from 'class-validator';

export class PurchaseKitDto {
  @IsNumber()
  kit_id: number;
}

