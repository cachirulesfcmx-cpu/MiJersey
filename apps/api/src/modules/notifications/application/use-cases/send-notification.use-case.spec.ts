import { NotificationEntity } from '../../domain/entities/notification.entity';
import { NotificationPreferenceEntity } from '../../domain/entities/notification-preference.entity';
import type { NotificationRepositoryPort } from '../../domain/ports/notification.repository.port';
import type { NotificationPreferenceRepositoryPort } from '../../domain/ports/notification-preference.repository.port';
import type { NotificationDispatchService } from '../services/notification-dispatch.service';
import { SendNotificationUseCase } from './send-notification.use-case';

function buildNotification(
  overrides: Partial<{ status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' }> = {},
) {
  return new NotificationEntity({
    id: 'notification-1',
    channel: 'EMAIL',
    templateKey: 'order.confirmation',
    recipient: 'customer@mijersey.dev',
    customerId: 'customer-1',
    status: overrides.status ?? 'QUEUED',
    payload: {},
    idempotencyKey: null,
    retryCount: 0,
    lastError: null,
    queuedAt: new Date(),
    sentAt: null,
    deliveredAt: null,
    failedAt: null,
    createdAt: new Date(),
  });
}

function buildPreference(channel: 'EMAIL', enabled: boolean) {
  return new NotificationPreferenceEntity({
    id: 'pref-1',
    customerId: 'customer-1',
    channel,
    enabled,
    updatedAt: new Date(),
  });
}

function buildUseCase(
  options: {
    existingByKey?: NotificationEntity | null;
    preferences?: NotificationPreferenceEntity[];
  } = {},
) {
  const notifications: jest.Mocked<NotificationRepositoryPort> = {
    findById: jest.fn(),
    findByIdempotencyKey: jest.fn().mockResolvedValue(options.existingByKey ?? null),
    create: jest.fn().mockResolvedValue(buildNotification()),
    updateStatus: jest.fn().mockResolvedValue(buildNotification({ status: 'DELIVERED' })),
    findMany: jest.fn(),
  };
  const preferences: jest.Mocked<NotificationPreferenceRepositoryPort> = {
    findByCustomer: jest.fn().mockResolvedValue(options.preferences ?? []),
    upsert: jest.fn(),
  };
  const dispatchService = {
    dispatch: jest.fn().mockResolvedValue(buildNotification({ status: 'DELIVERED' })),
  } as unknown as jest.Mocked<NotificationDispatchService>;

  return {
    useCase: new SendNotificationUseCase(notifications, preferences, dispatchService),
    notifications,
    preferences,
    dispatchService,
  };
}

describe('SendNotificationUseCase', () => {
  it('returns the existing notification without creating a new one when the idempotency key matches', async () => {
    const existing = buildNotification({ status: 'SENT' });
    const { useCase, notifications, dispatchService } = buildUseCase({ existingByKey: existing });

    const result = await useCase.execute({
      channel: 'EMAIL',
      templateKey: 'order.confirmation',
      recipient: 'customer@mijersey.dev',
      payload: {},
      idempotencyKey: 'order-1-confirmation',
    });

    expect(result).toBe(existing);
    expect(notifications.create).not.toHaveBeenCalled();
    expect(dispatchService.dispatch).not.toHaveBeenCalled();
  });

  it('skips sending when the customer disabled the channel', async () => {
    const { useCase, notifications, dispatchService } = buildUseCase({
      preferences: [buildPreference('EMAIL', false)],
    });

    const result = await useCase.execute({
      channel: 'EMAIL',
      templateKey: 'order.confirmation',
      recipient: 'customer@mijersey.dev',
      customerId: 'customer-1',
      payload: {},
    });

    expect(result).toBeNull();
    expect(notifications.create).not.toHaveBeenCalled();
    expect(dispatchService.dispatch).not.toHaveBeenCalled();
  });

  it('sends when the customer has no explicit preference (default enabled)', async () => {
    const { useCase, dispatchService } = buildUseCase({ preferences: [] });

    await useCase.execute({
      channel: 'EMAIL',
      templateKey: 'order.confirmation',
      recipient: 'customer@mijersey.dev',
      customerId: 'customer-1',
      payload: {},
    });

    expect(dispatchService.dispatch).toHaveBeenCalled();
  });

  it('creates the notification and dispatches it', async () => {
    const { useCase, notifications, dispatchService } = buildUseCase();

    await useCase.execute({
      channel: 'EMAIL',
      templateKey: 'order.confirmation',
      recipient: 'customer@mijersey.dev',
      payload: { orderId: '123' },
    });

    expect(notifications.create).toHaveBeenCalledWith({
      channel: 'EMAIL',
      templateKey: 'order.confirmation',
      recipient: 'customer@mijersey.dev',
      customerId: null,
      payload: { orderId: '123' },
      idempotencyKey: null,
    });
    expect(dispatchService.dispatch).toHaveBeenCalled();
  });
});
