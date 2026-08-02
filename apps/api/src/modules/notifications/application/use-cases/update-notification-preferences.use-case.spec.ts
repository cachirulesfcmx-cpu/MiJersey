import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import type { NotificationPreferenceRepositoryPort } from '../../domain/ports/notification-preference.repository.port';
import { GetNotificationPreferencesUseCase } from './get-notification-preferences.use-case';
import { UpdateNotificationPreferencesUseCase } from './update-notification-preferences.use-case';

describe('UpdateNotificationPreferencesUseCase', () => {
  it('upserts every requested channel and audits the change', async () => {
    const preferences: jest.Mocked<NotificationPreferenceRepositoryPort> = {
      findByCustomer: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({} as never),
    };
    const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
      record: jest.fn().mockResolvedValue(undefined),
    };
    const getPreferences = new GetNotificationPreferencesUseCase(preferences);

    const useCase = new UpdateNotificationPreferencesUseCase(preferences, auditLog, getPreferences);
    const result = await useCase.execute({
      customerId: 'customer-1',
      updates: [
        { channel: 'SMS', enabled: false },
        { channel: 'PUSH', enabled: false },
      ],
      ipAddress: '127.0.0.1',
    });

    expect(preferences.upsert).toHaveBeenNthCalledWith(1, 'customer-1', 'SMS', false);
    expect(preferences.upsert).toHaveBeenNthCalledWith(2, 'customer-1', 'PUSH', false);
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'customer-1',
        action: 'notification.preferences_updated',
        metadata: { updatedChannels: ['SMS', 'PUSH'] },
      }),
    );
    expect(result).toHaveLength(4);
  });
});
