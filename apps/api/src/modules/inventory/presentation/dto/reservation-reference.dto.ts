import { IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

/** Forma compartida por reserve/release/confirm — todas referencian una reserva por (referenceType, referenceId). */
export class ReservationReferenceDto {
  @IsUUID()
  variantId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  @Length(1, 64)
  referenceType!: string;

  @IsString()
  @Length(1, 64)
  referenceId!: string;

  @IsOptional()
  @IsString()
  @Length(1, 300)
  reason?: string;
}
