import type { AnalyticsQueryRepositoryPort } from '../../domain/ports/analytics-query.repository.port';
import { GetCustomerInsightsUseCase } from './get-customer-insights.use-case';

function buildUseCase() {
  const queries: jest.Mocked<AnalyticsQueryRepositoryPort> = {
    getSalesSummary: jest.fn(),
    getSalesTrend: jest.fn(),
    getCustomerInsights: jest
      .fn()
      .mockResolvedValue({ newCustomers: 1, returningCustomers: 2, topCustomers: [] }),
    getTopProducts: jest.fn(),
    countActiveProducts: jest.fn(),
    countOrders: jest.fn(),
  };

  return { useCase: new GetCustomerInsightsUseCase(queries), queries };
}

describe('GetCustomerInsightsUseCase', () => {
  it('defaults the limit to 10', async () => {
    const { useCase, queries } = buildUseCase();

    await useCase.execute({});

    expect(queries.getCustomerInsights).toHaveBeenCalledWith(expect.anything(), 10);
  });

  it('forwards a custom limit', async () => {
    const { useCase, queries } = buildUseCase();

    await useCase.execute({ limit: 25 });

    expect(queries.getCustomerInsights).toHaveBeenCalledWith(expect.anything(), 25);
  });
});
