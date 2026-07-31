import { IsOptional, IsString, Length } from 'class-validator';

export class CalculateRatesDto {
  @IsString()
  @Length(2, 2)
  country!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  state?: string;
}
