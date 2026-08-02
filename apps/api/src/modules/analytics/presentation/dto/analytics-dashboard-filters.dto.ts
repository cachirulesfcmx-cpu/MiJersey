import { IsOptional, IsString } from 'class-validator';

export class AnalyticsDashboardFiltersDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsString()
  segment?: string;
}
