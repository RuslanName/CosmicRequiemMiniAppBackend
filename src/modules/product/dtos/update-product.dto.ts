import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ProductType } from '../enums/product-type.enum';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @IsOptional()
  @IsString()
  value?: string;
}

