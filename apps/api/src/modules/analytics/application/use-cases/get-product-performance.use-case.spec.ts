import type { AnalyticsQueryRepositoryPort } from '../../domain/ports/analytics-query.repository.port';
import { GetProductPerformanceUseCase } from './get-product-performance.use-case';

function buildUseCase() {
  const queries: jest.Mocked<AnalyticsQueryRepositoryPort> = {
    getSalesSummary: jest.fn(),
    getSalesTrend: jest.fn(),
    getCustomerInsights: jest.fn(),
    getTopProducts: jest.fn().mockResolvedValue([]),
    countActiveProducts: jest.fn(),
    countOrders: jest.fn(),
  };

  return { useCase: new GetProductPerformanceUseCase(queries), queries };
}

describe('GetProductPerformanceUseCase', () => {
  it('defaults the limit to 20', async () => {
    const { useCase, queries } = buildUseCase();

    await useCase.execute({});

    expect(queries.getTopProducts).toHaveBeenCalledWith(expect.anything(), 20);
  });

  it('forwards a custom limit', async () => {
    const { useCase, queries } = buildUseCase();

    await useCase.execute({ limit: 3 });

    expect(queries.getTopProducts).toHaveBeenCalledWith(expect.anything(), 3);
  });
});
