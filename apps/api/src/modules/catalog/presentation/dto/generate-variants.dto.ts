import { IsNumber, IsOptional, Min } from 'class-validator';

export class GenerateVariantsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;
}
