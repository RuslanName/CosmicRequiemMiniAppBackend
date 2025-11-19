import { IsString, IsNumber, IsArray, IsEnum, IsOptional } from 'class-validator';
import { Currency } from '../../../common/enums/currency.enum';
import { AccessoryStatus } from '../../accessory/enums/accessory-status.enum';

export class CreateKitDto {
  @IsString()
  name: string;

  @IsEnum(Currency)
  currency: Currency;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsEnum(AccessoryStatus)
  status?: AccessoryStatus;

  @IsArray()
  @IsNumber({}, { each: true })
  product_ids: number[];
}
