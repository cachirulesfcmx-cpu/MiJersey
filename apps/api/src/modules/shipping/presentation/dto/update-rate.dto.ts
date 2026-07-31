import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class UpdateRateDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @IsOptional()
  @IsPositive()
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerKg?: number;

  @IsOptional()
  @IsPositive()
  freeShippingThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedDaysMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedDaysMax?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
