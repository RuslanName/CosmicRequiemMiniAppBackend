import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { Currency } from '../../../common/enums/currency.enum';
import { AccessoryStatus } from '../enums/accessory-status.enum';

export class CreateAccessoryDto {
  @IsString()
  name: string;

  @IsEnum(Currency)
  currency: Currency;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsEnum(AccessoryStatus)
  status?: AccessoryStatus;

  @IsNumber()
  product_id: number;
}
