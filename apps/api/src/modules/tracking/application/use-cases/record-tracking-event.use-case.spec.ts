import { TrackingEventEntity } from '../../domain/entities/tracking-event.entity';
import { TrackingProviderEntity } from '../../domain/entities/tracking-provider.entity';
import type { TrackingEventRepositoryPort } from '../../domain/ports/tracking-event.repository.port';
import type { TrackingEventDispatcherPort } from '../../domain/ports/tracking-event-dispatcher.port';
import type { TrackingProviderRepositoryPort } from '../../domain/ports/tracking-provider.repository.port';
import type { TrackingDedupService } from '../services/tracking-dedup.service';
import { RecordTrackingEventUseCase } from './record-tracking-event.use-case';

function buildProvider(consentCategory: string | null): TrackingProviderEntity {
  return new TrackingProviderEntity({
    id: `provider-${consentCategory ?? 'none'}`,
    provider: 'GOOGLE_ANALYTICS_4',
    status: 'ACTIVE',
    configuration: { measurementId: 'G-123' },
    consentCategory,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(
  options: { isDuplicate?: boolean; activeProviders?: TrackingProviderEntity[] } = {},
) {
  const events: jest.Mocked<TrackingEventRepositoryPort> = {
    create: jest.fn().mockResolvedValue(
      new TrackingEventEntity({
        id: 'event-1',
        eventName: 'purchase',
        source: 'checkout',
        payload: {},
        consentRequired: true,
        createdAt: new Date(),
      }),
    ),
    findMany: jest.fn(),
  };
  const providers: jest.Mocked<TrackingProviderRepositoryPort> = {
    findById: jest.fn(),
    findByProvider: jest.fn(),
    findMany: jest.fn(),
    findActive: jest
      .fn()
      .mockResolvedValue(options.activeProviders ?? [buildProvider('analytics')]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const dispatcher: jest.Mocked<TrackingEventDispatcherPort> = {
    dispatch: jest.fn().mockResolvedValue({ delivered: false, raw: {} }),
  };
  const dedup = {
    isDuplicate: jest.fn().mockResolvedValue(options.isDuplicate ?? false),
  } as unknown as jest.Mocked<TrackingDedupService>;

  return {
    useCase: new RecordTrackingEventUseCase(events, providers, dispatcher, dedup),
    events,
    providers,
    dispatcher,
    dedup,
  };
}

describe('RecordTrackingEventUseCase', () => {
  it('returns null without creating an event when it is a duplicate', async () => {
    const { useCase, events, dispatcher } = buildUseCase({ isDuplicate: true });

    const result = await useCase.execute({
      eventName: 'purchase',
      source: 'checkout',
      payload: {},
    });

    expect(result).toBeNull();
    expect(events.create).not.toHaveBeenCalled();
    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('dispatches to providers whose consent category was granted', async () => {
    const { useCase, dispatcher } = buildUseCase({ activeProviders: [buildProvider('analytics')] });

    await useCase.execute({
      eventName: 'purchase',
      source: 'checkout',
      payload: {},
      consentRequired: true,
      grantedConsentCategories: ['analytics'],
    });

    expect(dispatcher.dispatch).toHaveBeenCalledTimes(1);
  });

  it('skips dispatch for providers whose consent category was not granted', async () => {
    const { useCase, dispatcher } = buildUseCase({ activeProviders: [buildProvider('marketing')] });

    await useCase.execute({
      eventName: 'purchase',
      source: 'checkout',
      payload: {},
      consentRequired: true,
      grantedConsentCategories: ['analytics'],
    });

    expect(dispatcher.dispatch).not.toHaveBeenCalled();
  });

  it('always dispatches to providers without a consent category', async () => {
    const { useCase, dispatcher } = buildUseCase({ activeProviders: [buildProvider(null)] });

    await useCase.execute({ eventName: 'purchase', source: 'checkout', payload: {} });

    expect(dispatcher.dispatch).toHaveBeenCalledTimes(1);
  });

  it('still records the event even when no provider is eligible to receive it', async () => {
    const { useCase, events } = buildUseCase({ activeProviders: [buildProvider('marketing')] });

    const result = await useCase.execute({
      eventName: 'purchase',
      source: 'checkout',
      payload: {},
    });

    expect(events.create).toHaveBeenCalled();
    expect(result).not.toBeNull();
  });
});
