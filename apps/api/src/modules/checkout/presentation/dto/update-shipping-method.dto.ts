import { IsBoolean, IsInt, IsOptional, IsPositive, IsString, Length, Min } from 'class-validator';

export class UpdateShippingMethodDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @IsOptional()
  @IsPositive()
  basePrice?: number;

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
