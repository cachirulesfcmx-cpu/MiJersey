import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreateRateDto {
  @IsUUID()
  carrierId!: string;

  @IsUUID()
  zoneId!: string;

  @IsString()
  @Length(1, 150)
  name!: string;

  @IsPositive()
  basePrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerKg?: number;

  @IsOptional()
  @IsPositive()
  freeShippingThreshold?: number;

  @IsInt()
  @Min(0)
  estimatedDaysMin!: number;

  @IsInt()
  @Min(0)
  estimatedDaysMax!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
