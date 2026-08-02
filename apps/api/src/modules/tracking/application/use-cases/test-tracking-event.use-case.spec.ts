import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { TrackingEventEntity } from '../../domain/entities/tracking-event.entity';
import { TrackingProviderEntity } from '../../domain/entities/tracking-provider.entity';
import { TrackingProviderNotFoundError } from '../../domain/errors/tracking.errors';
import type { TrackingEventRepositoryPort } from '../../domain/ports/tracking-event.repository.port';
import type { TrackingEventDispatcherPort } from '../../domain/ports/tracking-event-dispatcher.port';
import type { TrackingProviderRepositoryPort } from '../../domain/ports/tracking-provider.repository.port';
import { TestTrackingEventUseCase } from './test-tracking-event.use-case';

function buildProvider(): TrackingProviderEntity {
  return new TrackingProviderEntity({
    id: 'provider-1',
    provider: 'GOOGLE_ANALYTICS_4',
    status: 'ACTIVE',
    configuration: { measurementId: 'G-123' },
    consentCategory: 'analytics',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(options: { existing?: TrackingProviderEntity | null } = {}) {
  const providers: jest.Mocked<TrackingProviderRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.existing === undefined ? buildProvider() : options.existing),
    findByProvider: jest.fn(),
    findMany: jest.fn(),
    findActive: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const events: jest.Mocked<TrackingEventRepositoryPort> = {
    create: jest.fn().mockResolvedValue(
      new TrackingEventEntity({
        id: 'event-1',
        eventName: 'purchase',
        source: 'admin-test',
        payload: {},
        consentRequired: false,
        createdAt: new Date(),
      }),
    ),
    findMany: jest.fn(),
  };
  const dispatcher: jest.Mocked<TrackingEventDispatcherPort> = {
    dispatch: jest.fn().mockResolvedValue({ delivered: false, raw: {} }),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new TestTrackingEventUseCase(providers, events, dispatcher, auditLog),
    providers,
    events,
    dispatcher,
    auditLog,
  };
}

describe('TestTrackingEventUseCase', () => {
  it('throws TrackingProviderNotFoundError when the provider does not exist', async () => {
    const { useCase } = buildUseCase({ existing: null });

    await expect(
      useCase.execute({
        providerId: 'provider-1',
        eventName: 'purchase',
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(TrackingProviderNotFoundError);
  });

  it('dispatches the event, logs it with source admin-test, and audits it', async () => {
    const { useCase, dispatcher, events, auditLog } = buildUseCase();

    await useCase.execute({
      providerId: 'provider-1',
      eventName: 'purchase',
      payload: { value: 100 },
      actorUserId: 'admin-1',
      ipAddress: '127.0.0.1',
    });

    expect(dispatcher.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'purchase', payload: { value: 100 } }),
    );
    expect(events.create).toHaveBeenCalledWith({
      eventName: 'purchase',
      source: 'admin-test',
      payload: { value: 100 },
      consentRequired: false,
    });
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'tracking.event_tested' }),
    );
  });
});
