import { IsInt, IsUUID, Min } from 'class-validator';

export class SetSafetyStockDto {
  @IsUUID()
  variantId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsInt()
  @Min(0)
  safetyStock!: number;
}
