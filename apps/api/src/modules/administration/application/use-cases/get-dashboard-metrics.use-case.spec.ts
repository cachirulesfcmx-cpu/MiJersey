import type { GetUserStatsUseCase } from '../../../identity/application/use-cases/get-user-stats.use-case';
import { GetDashboardMetricsUseCase } from './get-dashboard-metrics.use-case';

describe('GetDashboardMetricsUseCase', () => {
  it('marks Identity-backed metrics as available and the rest as pending', async () => {
    const getUserStatsUseCase = {
      execute: jest.fn().mockResolvedValue({
        totalUsers: 10,
        totalCustomers: 7,
        totalStaff: 3,
        totalActiveUsers: 9,
      }),
    } as unknown as jest.Mocked<GetUserStatsUseCase>;

    const useCase = new GetDashboardMetricsUseCase(getUserStatsUseCase);
    const metrics = await useCase.execute();

    expect(metrics.customers).toEqual({ value: 7, available: true });
    expect(metrics.staff).toEqual({ value: 3, available: true });
    expect(metrics.activeUsers).toEqual({ value: 9, available: true });
    expect(metrics.sales.available).toBe(false);
    expect(metrics.orders.available).toBe(false);
    expect(metrics.products.available).toBe(false);
    expect(metrics.revenue.available).toBe(false);
    expect(metrics.conversionRate.available).toBe(false);
    expect(metrics.inventoryAlerts.available).toBe(false);
  });
});
