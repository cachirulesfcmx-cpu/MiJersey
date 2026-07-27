import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

import { InventoryMovementType } from '../../domain/value-objects/inventory-enums';

export class AdjustInventoryDto {
  @IsUUID()
  variantId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsEnum(InventoryMovementType)
  type!: InventoryMovementType;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  @Length(1, 300)
  reason?: string;

  @IsOptional()
  @IsBoolean()
  allowNegative?: boolean;
}
