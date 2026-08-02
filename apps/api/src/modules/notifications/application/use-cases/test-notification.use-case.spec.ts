import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import type { NotificationRepositoryPort } from '../../domain/ports/notification.repository.port';
import type { NotificationDispatchService } from '../services/notification-dispatch.service';
import { TestNotificationUseCase } from './test-notification.use-case';

function buildNotification(): NotificationEntity {
  return new NotificationEntity({
    id: 'notification-1',
    channel: 'EMAIL',
    templateKey: 'order.confirmation',
    recipient: 'test@mijersey.dev',
    customerId: null,
    status: 'QUEUED',
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

describe('TestNotificationUseCase', () => {
  it('creates the notification without a customerId, dispatches it, and audits it', async () => {
    const notifications: jest.Mocked<NotificationRepositoryPort> = {
      findById: jest.fn(),
      findByIdempotencyKey: jest.fn(),
      create: jest.fn().mockResolvedValue(buildNotification()),
      updateStatus: jest.fn(),
      findMany: jest.fn(),
    };
    const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const dispatchService = {
      dispatch: jest.fn().mockResolvedValue(buildNotification()),
    } as unknown as jest.Mocked<NotificationDispatchService>;

    const useCase = new TestNotificationUseCase(notifications, auditLog, dispatchService);
    await useCase.execute({
      channel: 'EMAIL',
      templateKey: 'order.confirmation',
      recipient: 'test@mijersey.dev',
      actorUserId: 'admin-1',
      ipAddress: '127.0.0.1',
    });

    expect(notifications.create).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: null, idempotencyKey: null }),
    );
    expect(dispatchService.dispatch).toHaveBeenCalled();
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'notification.tested' }),
    );
  });
});
