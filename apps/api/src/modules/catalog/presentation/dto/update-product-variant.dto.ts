import { IsIn, IsNumber, IsOptional, IsPositive, IsString, Length, Min } from 'class-validator';

import { ProductVariantStatus } from '../../domain/value-objects/product-enums';

export class UpdateProductVariantDto {
  @IsOptional()
  @IsString()
  @Length(1, 64)
  sku?: string;

  @IsOptional()
  @IsString()
  @Length(1, 96)
  slug?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  compareAtPrice?: number | null;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight?: number | null;

  @IsOptional()
  @IsString()
  @Length(1, 64)
  barcode?: string | null;

  @IsOptional()
  @IsString()
  imageId?: string | null;

  @IsOptional()
  @IsIn(Object.values(ProductVariantStatus))
  status?: ProductVariantStatus;
}
