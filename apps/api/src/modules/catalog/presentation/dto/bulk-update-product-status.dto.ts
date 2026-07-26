import { ArrayNotEmpty, IsArray, IsIn, IsUUID } from 'class-validator';

import { ProductStatus } from '../../domain/value-objects/product-enums';

export class BulkUpdateProductStatusDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids!: string[];

  @IsIn(Object.values(ProductStatus))
  status!: ProductStatus;
}
