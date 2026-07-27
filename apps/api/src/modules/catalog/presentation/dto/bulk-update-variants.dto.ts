import { ArrayNotEmpty, IsArray, IsIn, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

import { ProductVariantStatus } from '../../domain/value-objects/product-enums';

export class BulkUpdateVariantsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids!: string[];

  @IsOptional()
  @IsIn(Object.values(ProductVariantStatus))
  status?: ProductVariantStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  compareAtPrice?: number | null;
}
