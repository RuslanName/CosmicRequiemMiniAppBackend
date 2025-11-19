import { IsNumber } from 'class-validator';

export class PurchaseAccessoryDto {
  @IsNumber()
  accessory_id: number;
}

