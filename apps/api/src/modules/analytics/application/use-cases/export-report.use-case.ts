import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { ANALYTICS_EVENT_REPOSITORY, ANALYTICS_QUERY_REPOSITORY } from '../../analytics.constants';
import { InvalidAnalyticsQueryError } from '../../domain/errors/analytics.errors';
import type { AnalyticsEventRepositoryPort } from '../../domain/ports/analytics-event.repository.port';
import type { AnalyticsQueryRepositoryPort } from '../../domain/ports/analytics-query.repository.port';
import { toCsv } from '../../domain/value-objects/csv.util';
import type { DateRangeInput } from '../../domain/value-objects/date-range.util';
import { resolveDateRange } from '../../domain/value-objects/date-range.util';

export type ExportReportType = 'sales' | 'customers' | 'products' | 'events';

export interface ExportReportInput extends DateRangeInput {
  type: ExportReportType;
  actorUserId: string;
  ipAddress: string | null;
}

export interface ExportReportResult {
  filename: string;
  csv: string;
}

/** `GET /admin/analytics/export` (spec §6 "Report Export", §7) — a diferencia de las lecturas de reportes (no auditadas, para no inundar el log en cada carga de dashboard), exportar SÍ deja rastro explícito (spec §10 "exportaciones") porque los datos salen del sistema como archivo. */
@Injectable()
export class ExportReportUseCase {
  constructor(
    @Inject(ANALYTICS_QUERY_REPOSITORY) private readonly queries: AnalyticsQueryRepositoryPort,
    @Inject(ANALYTICS_EVENT_REPOSITORY) private readonly events: AnalyticsEventRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: ExportReportInput): Promise<ExportReportResult> {
    const range = resolveDateRange(input);
    const csv = await this.buildCsv(input.type, range);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'analytics.report_exported',
      ipAddress: input.ipAddress,
      metadata: { type: input.type, from: range.from.toISOString(), to: range.to.toISOString() },
    });

    const datePart = range.to.toISOString().slice(0, 10);
    return { filename: `analytics-${input.type}-${datePart}.csv`, csv };
  }

  private async buildCsv(
    type: ExportReportType,
    range: ReturnType<typeof resolveDateRange>,
  ): Promise<string> {
    switch (type) {
      case 'sales': {
        const trend = await this.queries.getSalesTrend(range);
        return toCsv(trend, [
          { header: 'date', value: (row) => row.date },
          { header: 'orderCount', value: (row) => row.orderCount },
          { header: 'revenue', value: (row) => row.revenue },
        ]);
      }
      case 'customers': {
        const insights = await this.queries.getCustomerInsights(range, 1000);
        return toCsv(insights.topCustomers, [
          { header: 'customerId', value: (row) => row.customerId },
          { header: 'email', value: (row) => row.email },
          { header: 'name', value: (row) => row.name },
          { header: 'orderCount', value: (row) => row.orderCount },
          { header: 'totalSpent', value: (row) => row.totalSpent },
        ]);
      }
      case 'products': {
        const products = await this.queries.getTopProducts(range, 1000);
        return toCsv(products, [
          { header: 'productId', value: (row) => row.productId },
          { header: 'sku', value: (row) => row.sku },
          { header: 'name', value: (row) => row.name },
          { header: 'unitsSold', value: (row) => row.unitsSold },
          { header: 'revenue', value: (row) => row.revenue },
        ]);
      }
      case 'events': {
        const result = await this.events.findMany({
          page: 1,
          pageSize: 1000,
          from: range.from,
          to: range.to,
        });
        return toCsv(result.items, [
          { header: 'occurredAt', value: (row) => row.toJSON().occurredAt.toISOString() },
          { header: 'eventType', value: (row) => row.toJSON().eventType },
          { header: 'entityType', value: (row) => row.toJSON().entityType },
          { header: 'entityId', value: (row) => row.toJSON().entityId },
        ]);
      }
      default:
        throw new InvalidAnalyticsQueryError(`Tipo de reporte desconocido: ${type as string}`);
    }
  }
}
