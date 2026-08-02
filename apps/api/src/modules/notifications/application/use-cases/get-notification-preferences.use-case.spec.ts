import { NotificationPreferenceEntity } from '../../domain/entities/notification-preference.entity';
import type { NotificationPreferenceRepositoryPort } from '../../domain/ports/notification-preference.repository.port';
import { GetNotificationPreferencesUseCase } from './get-notification-preferences.use-case';

describe('GetNotificationPreferencesUseCase', () => {
  it('synthesizes all four channels as enabled by default when there are no stored rows', async () => {
    const preferences: jest.Mocked<NotificationPreferenceRepositoryPort> = {
      findByCustomer: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
    };

    const useCase = new GetNotificationPreferencesUseCase(preferences);
    const result = await useCase.execute('customer-1');

    expect(result).toEqual([
      { channel: 'EMAIL', enabled: true },
      { channel: 'SMS', enabled: true },
      { channel: 'WHATSAPP', enabled: true },
      { channel: 'PUSH', enabled: true },
    ]);
  });

  it('overrides the default with a stored, explicitly-disabled preference', async () => {
    const preferences: jest.Mocked<NotificationPreferenceRepositoryPort> = {
      findByCustomer: jest.fn().mockResolvedValue([
        new NotificationPreferenceEntity({
          id: 'pref-1',
          customerId: 'customer-1',
          channel: 'SMS',
          enabled: false,
          updatedAt: new Date(),
        }),
      ]),
      upsert: jest.fn(),
    };

    const useCase = new GetNotificationPreferencesUseCase(preferences);
    const result = await useCase.execute('customer-1');

    expect(result).toContainEqual({ channel: 'SMS', enabled: false });
    expect(result).toContainEqual({ channel: 'EMAIL', enabled: true });
  });
});
