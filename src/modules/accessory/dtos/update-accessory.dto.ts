import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Currency } from '../../../common/enums/currency.enum';
import { AccessoryStatus } from '../enums/accessory-status.enum';

export class UpdateAccessoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsEnum(AccessoryStatus)
  status?: AccessoryStatus;

  @IsOptional()
  @IsNumber()
  product_id?: number;
}
