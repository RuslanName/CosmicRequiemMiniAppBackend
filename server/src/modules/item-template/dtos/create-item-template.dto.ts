import { IsString, IsEnum } from 'class-validator';
import { ProductType } from '../enums/product-type.enum';

export class CreateItemTemplateDto {
  @IsString()
  name: string;

  @IsEnum(ProductType)
  type: ProductType;

  @IsString()
  value: string;
}
