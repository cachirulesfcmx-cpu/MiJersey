import { IsBoolean, IsInt, IsOptional, IsPositive, IsString, Length, Min } from 'class-validator';

export class CreateShippingMethodDto {
  @IsString()
  @Length(1, 150)
  name!: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @IsPositive()
  basePrice!: number;

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
