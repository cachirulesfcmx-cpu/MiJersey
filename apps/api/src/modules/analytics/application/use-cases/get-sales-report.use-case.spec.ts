import type {
  AnalyticsQueryRepositoryPort,
  SalesSummary,
  SalesTrendPoint,
} from '../../domain/ports/analytics-query.repository.port';
import type { AnalyticsCacheService } from '../services/analytics-cache.service';
import { GetSalesReportUseCase } from './get-sales-report.use-case';

const SUMMARY: SalesSummary = {
  orderCount: 5,
  revenue: '500.00',
  averageOrderValue: '100.00',
  currency: 'USD',
};

const TREND: SalesTrendPoint[] = [{ date: '2026-01-01', orderCount: 5, revenue: '500.00' }];

function buildUseCase() {
  const queries: jest.Mocked<AnalyticsQueryRepositoryPort> = {
    getSalesSummary: jest.fn().mockResolvedValue(SUMMARY),
    getSalesTrend: jest.fn().mockResolvedValue(TREND),
    getCustomerInsights: jest.fn(),
    getTopProducts: jest.fn(),
    countActiveProducts: jest.fn(),
    countOrders: jest.fn(),
  };
  const cache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AnalyticsCacheService>;

  return { useCase: new GetSalesReportUseCase(queries, cache), queries, cache };
}

describe('GetSalesReportUseCase', () => {
  it('returns the summary and trend for the resolved range', async () => {
    const { useCase } = buildUseCase();

    const view = await useCase.execute({ from: '2026-01-01', to: '2026-01-31' });

    expect(view.summary).toEqual(SUMMARY);
    expect(view.trend).toEqual(TREND);
  });

  it('rejects an invalid date range without querying', async () => {
    const { useCase, queries } = buildUseCase();

    await expect(useCase.execute({ from: 'nope' })).rejects.toThrow(RangeError);
    expect(queries.getSalesSummary).not.toHaveBeenCalled();
  });
});
