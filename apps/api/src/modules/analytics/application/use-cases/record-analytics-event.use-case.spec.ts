import { AnalyticsEventEntity } from '../../domain/entities/analytics-event.entity';
import type { AnalyticsEventRepositoryPort } from '../../domain/ports/analytics-event.repository.port';
import { RecordAnalyticsEventUseCase } from './record-analytics-event.use-case';

describe('RecordAnalyticsEventUseCase', () => {
  it('creates an event through the repository', async () => {
    const created = new AnalyticsEventEntity({
      id: 'event-1',
      eventType: 'order.placed',
      entityType: 'order',
      entityId: 'order-1',
      payload: { total: 100 },
      occurredAt: new Date(),
    });
    const events: jest.Mocked<AnalyticsEventRepositoryPort> = {
      create: jest.fn().mockResolvedValue(created),
      findMany: jest.fn(),
    };

    const useCase = new RecordAnalyticsEventUseCase(events);
    const result = await useCase.execute({
      eventType: 'order.placed',
      entityType: 'order',
      entityId: 'order-1',
      payload: { total: 100 },
    });

    expect(events.create).toHaveBeenCalledWith({
      eventType: 'order.placed',
      entityType: 'order',
      entityId: 'order-1',
      payload: { total: 100 },
    });
    expect(result).toBe(created);
  });
});
