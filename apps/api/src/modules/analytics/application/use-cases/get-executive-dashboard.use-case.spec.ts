import type {
  AnalyticsQueryRepositoryPort,
  CustomerInsights,
  SalesSummary,
  TopProduct,
} from '../../domain/ports/analytics-query.repository.port';
import type { AnalyticsCacheService } from '../services/analytics-cache.service';
import { GetExecutiveDashboardUseCase } from './get-executive-dashboard.use-case';

const SUMMARY: SalesSummary = {
  orderCount: 12,
  revenue: '1000.00',
  averageOrderValue: '100.00',
  currency: 'USD',
};

const INSIGHTS: CustomerInsights = { newCustomers: 3, returningCustomers: 5, topCustomers: [] };

const TOP_PRODUCTS: TopProduct[] = [
  { productId: 'p1', sku: 'SKU-1', name: 'Jersey', unitsSold: 4, revenue: '400.00' },
];

function buildUseCase() {
  const queries: jest.Mocked<AnalyticsQueryRepositoryPort> = {
    getSalesSummary: jest.fn().mockResolvedValue(SUMMARY),
    getSalesTrend: jest.fn(),
    getCustomerInsights: jest.fn().mockResolvedValue(INSIGHTS),
    getTopProducts: jest.fn().mockResolvedValue(TOP_PRODUCTS),
    countActiveProducts: jest.fn().mockResolvedValue(42),
    countOrders: jest.fn(),
  };
  const cache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AnalyticsCacheService>;

  return { useCase: new GetExecutiveDashboardUseCase(queries, cache), queries, cache };
}

describe('GetExecutiveDashboardUseCase', () => {
  it('combines sales, customer, and product data into a single view', async () => {
    const { useCase, queries } = buildUseCase();

    const view = await useCase.execute({ from: '2026-01-01', to: '2026-01-31' });

    expect(queries.getCustomerInsights).toHaveBeenCalledWith(expect.anything(), 1);
    expect(queries.getTopProducts).toHaveBeenCalledWith(expect.anything(), 5);
    expect(view).toMatchObject({
      orderCount: 12,
      revenue: '1000.00',
      averageOrderValue: '100.00',
      currency: 'USD',
      newCustomers: 3,
      activeProducts: 42,
      topProducts: TOP_PRODUCTS,
    });
  });

  it('caches the computed view', async () => {
    const { useCase, cache } = buildUseCase();

    await useCase.execute({});

    expect(cache.set).toHaveBeenCalledWith(
      expect.stringContaining('dashboard'),
      expect.stringContaining('"orderCount":12'),
    );
  });

  it('returns the cached view without querying when present', async () => {
    const { useCase, queries, cache } = buildUseCase();
    (cache.get as jest.Mock).mockResolvedValue(JSON.stringify({ orderCount: 999 }));

    const view = await useCase.execute({});

    expect(queries.getSalesSummary).not.toHaveBeenCalled();
    expect(view).toEqual({ orderCount: 999 });
  });
});
