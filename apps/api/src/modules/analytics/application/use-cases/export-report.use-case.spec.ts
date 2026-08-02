import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AnalyticsEventEntity } from '../../domain/entities/analytics-event.entity';
import type { AnalyticsEventRepositoryPort } from '../../domain/ports/analytics-event.repository.port';
import type { AnalyticsQueryRepositoryPort } from '../../domain/ports/analytics-query.repository.port';
import { ExportReportUseCase } from './export-report.use-case';

function buildUseCase() {
  const queries: jest.Mocked<AnalyticsQueryRepositoryPort> = {
    getSalesSummary: jest.fn(),
    getSalesTrend: jest
      .fn()
      .mockResolvedValue([{ date: '2026-01-01', orderCount: 2, revenue: '200.00' }]),
    getCustomerInsights: jest.fn().mockResolvedValue({
      newCustomers: 1,
      returningCustomers: 0,
      topCustomers: [
        {
          customerId: 'c1',
          email: 'c1@mijersey.dev',
          name: 'Cliente Uno',
          orderCount: 2,
          totalSpent: '200.00',
        },
      ],
    }),
    getTopProducts: jest
      .fn()
      .mockResolvedValue([
        { productId: 'p1', sku: 'SKU-1', name: 'Jersey', unitsSold: 2, revenue: '200.00' },
      ]),
    countActiveProducts: jest.fn(),
    countOrders: jest.fn(),
  };
  const events: jest.Mocked<AnalyticsEventRepositoryPort> = {
    create: jest.fn(),
    findMany: jest.fn().mockResolvedValue({
      items: [
        new AnalyticsEventEntity({
          id: 'e1',
          eventType: 'order.placed',
          entityType: 'order',
          entityId: 'order-1',
          payload: {},
          occurredAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      ],
      total: 1,
      page: 1,
      pageSize: 1000,
      totalPages: 1,
    }),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new ExportReportUseCase(queries, events, auditLog), queries, events, auditLog };
}

describe('ExportReportUseCase', () => {
  it('builds a sales CSV and audits the export', async () => {
    const { useCase, auditLog } = buildUseCase();

    const result = await useCase.execute({
      type: 'sales',
      actorUserId: 'admin-1',
      ipAddress: '127.0.0.1',
    });

    expect(result.csv).toBe('date,orderCount,revenue\n2026-01-01,2,200.00');
    expect(result.filename).toMatch(/^analytics-sales-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'analytics.report_exported', userId: 'admin-1' }),
    );
  });

  it('builds a customers CSV', async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute({
      type: 'customers',
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(result.csv).toContain('customerId,email,name,orderCount,totalSpent');
    expect(result.csv).toContain('c1,c1@mijersey.dev,Cliente Uno,2,200.00');
  });

  it('builds a products CSV', async () => {
    const { useCase } = buildUseCase();

    const result = await useCase.execute({
      type: 'products',
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(result.csv).toContain('productId,sku,name,unitsSold,revenue');
    expect(result.csv).toContain('p1,SKU-1,Jersey,2,200.00');
  });

  it('builds an events CSV', async () => {
    const { useCase, events } = buildUseCase();

    const result = await useCase.execute({
      type: 'events',
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(events.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 1000 }),
    );
    expect(result.csv).toContain('occurredAt,eventType,entityType,entityId');
    expect(result.csv).toContain('order.placed,order,order-1');
  });
});
