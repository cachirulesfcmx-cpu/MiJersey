import { IsEnum, IsISO8601, IsOptional } from 'class-validator';

import type { ExportReportType } from '../../application/use-cases/export-report.use-case';

const EXPORT_REPORT_TYPES: ExportReportType[] = ['sales', 'customers', 'products', 'events'];

export class ExportReportQueryDto {
  @IsEnum(EXPORT_REPORT_TYPES)
  type!: ExportReportType;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
