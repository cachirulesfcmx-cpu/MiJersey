import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

import { AnalyticsDashboardFiltersDto } from './analytics-dashboard-filters.dto';
import { AnalyticsWidgetDto } from './analytics-widget.dto';

export class CreateAnalyticsDashboardDto {
  @IsString()
  name!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalyticsWidgetDto)
  widgets!: AnalyticsWidgetDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AnalyticsDashboardFiltersDto)
  filters?: AnalyticsDashboardFiltersDto;
}
