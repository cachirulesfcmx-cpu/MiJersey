import { IsEnum, IsObject, IsString } from 'class-validator';

const WIDGET_TYPES = ['sales', 'customers', 'products', 'events', 'kpi'] as const;

export class AnalyticsWidgetDto {
  @IsString()
  id!: string;

  @IsEnum(WIDGET_TYPES)
  type!: (typeof WIDGET_TYPES)[number];

  @IsString()
  title!: string;

  @IsObject()
  config!: Record<string, unknown>;
}
