import { IsOptional, IsString, IsNumber, IsArray, IsEnum } from 'class-validator';
import { Currency } from '../../../common/enums/currency.enum';
import { AccessoryStatus } from '../../accessory/enums/accessory-status.enum';

export class UpdateKitDto {
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
  @IsArray()
  @IsNumber({}, { each: true })
  product_ids?: number[];
}
