import { IsIn, IsOptional, IsString, Length } from 'class-validator';

import { ProductType, ProductVisibility } from '../../domain/value-objects/product-enums';

export class CreateProductDto {
  @IsString()
  @Length(1, 64)
  sku!: string;

  @IsOptional()
  @IsString()
  @Length(1, 96)
  slug?: string;

  @IsString()
  @Length(1, 200)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(0, 300)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(Object.values(ProductType))
  type?: ProductType;

  @IsOptional()
  @IsIn(Object.values(ProductVisibility))
  visibility?: ProductVisibility;
}
