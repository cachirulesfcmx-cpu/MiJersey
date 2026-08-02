import type { AnalyticsEventRepositoryPort } from '../../domain/ports/analytics-event.repository.port';
import { ListAnalyticsEventsUseCase } from './list-analytics-events.use-case';

describe('ListAnalyticsEventsUseCase', () => {
  it('forwards the query params to the repository', async () => {
    const events: jest.Mocked<AnalyticsEventRepositoryPort> = {
      create: jest.fn(),
      findMany: jest
        .fn()
        .mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 }),
    };

    const useCase = new ListAnalyticsEventsUseCase(events);
    await useCase.execute({ page: 2, pageSize: 10, eventType: 'order.placed' });

    expect(events.findMany).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      eventType: 'order.placed',
    });
  });
});
