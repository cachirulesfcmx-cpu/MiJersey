import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import {
  MaxRetriesExceededError,
  NotificationNotFailedError,
  NotificationNotFoundError,
} from '../../domain/errors/notifications.errors';
import type { NotificationRepositoryPort } from '../../domain/ports/notification.repository.port';
import { MAX_NOTIFICATION_RETRIES } from '../../notifications.constants';
import type { NotificationDispatchService } from '../services/notification-dispatch.service';
import { RetryNotificationUseCase } from './retry-notification.use-case';

function buildNotification(
  overrides: Partial<{
    status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
    retryCount: number;
  }> = {},
): NotificationEntity {
  return new NotificationEntity({
    id: 'notification-1',
    channel: 'EMAIL',
    templateKey: 'order.confirmation',
    recipient: 'customer@mijersey.dev',
    customerId: 'customer-1',
    status: overrides.status ?? 'FAILED',
    payload: {},
    idempotencyKey: null,
    retryCount: overrides.retryCount ?? 0,
    lastError: 'boom',
    queuedAt: new Date(),
    sentAt: null,
    deliveredAt: null,
    failedAt: new Date(),
    createdAt: new Date(),
  });
}

function buildUseCase(options: { existing?: NotificationEntity | null } = {}) {
  const notifications: jest.Mocked<NotificationRepositoryPort> = {
    findById: jest
      .fn()
      .mockResolvedValue(options.existing === undefined ? buildNotification() : options.existing),
    findByIdempotencyKey: jest.fn(),
    create: jest.fn(),
    updateStatus: jest
      .fn()
      .mockResolvedValue(buildNotification({ status: 'QUEUED', retryCount: 1 })),
    findMany: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };
  const dispatchService = {
    dispatch: jest
      .fn()
      .mockResolvedValue(buildNotification({ status: 'DELIVERED', retryCount: 1 })),
  } as unknown as jest.Mocked<NotificationDispatchService>;

  return {
    useCase: new RetryNotificationUseCase(notifications, auditLog, dispatchService),
    notifications,
    auditLog,
    dispatchService,
  };
}

describe('RetryNotificationUseCase', () => {
  it('throws NotificationNotFoundError when the notification does not exist', async () => {
    const { useCase } = buildUseCase({ existing: null });

    await expect(
      useCase.execute({ id: 'notification-1', actorUserId: 'admin-1', ipAddress: null }),
    ).rejects.toThrow(NotificationNotFoundError);
  });

  it('throws NotificationNotFailedError when the notification is not FAILED', async () => {
    const { useCase } = buildUseCase({ existing: buildNotification({ status: 'SENT' }) });

    await expect(
      useCase.execute({ id: 'notification-1', actorUserId: 'admin-1', ipAddress: null }),
    ).rejects.toThrow(NotificationNotFailedError);
  });

  it('throws MaxRetriesExceededError when the retry cap was reached', async () => {
    const { useCase } = buildUseCase({
      existing: buildNotification({ retryCount: MAX_NOTIFICATION_RETRIES }),
    });

    await expect(
      useCase.execute({ id: 'notification-1', actorUserId: 'admin-1', ipAddress: null }),
    ).rejects.toThrow(MaxRetriesExceededError);
  });

  it('bumps the retry count, dispatches again, and audits it', async () => {
    const { useCase, notifications, dispatchService, auditLog } = buildUseCase();

    await useCase.execute({ id: 'notification-1', actorUserId: 'admin-1', ipAddress: '127.0.0.1' });

    expect(notifications.updateStatus).toHaveBeenCalledWith('notification-1', {
      status: 'QUEUED',
      retryCount: 1,
    });
    expect(dispatchService.dispatch).toHaveBeenCalled();
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'notification.retried' }),
    );
  });
});
