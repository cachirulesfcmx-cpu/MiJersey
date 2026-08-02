import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { SystemSettingEntity } from '../../domain/entities/system-setting.entity';
import { InvalidSystemSettingError } from '../../domain/errors/site-config.errors';
import type { SystemSettingRepositoryPort } from '../../domain/ports/system-setting.repository.port';
import { UpdateSystemSettingsUseCase } from './update-system-settings.use-case';

function buildSetting(key: string, category: string): SystemSettingEntity {
  return new SystemSettingEntity({
    id: `${key}-id`,
    key,
    value: 'x',
    category,
    updatedAt: new Date(),
  });
}

function buildUseCase() {
  const repository: jest.Mocked<SystemSettingRepositoryPort> = {
    findMany: jest.fn(),
    upsertMany: jest
      .fn()
      .mockImplementation((entries) =>
        Promise.resolve(
          entries.map((entry: { key: string; category: string }) =>
            buildSetting(entry.key, entry.category),
          ),
        ),
      ),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return { useCase: new UpdateSystemSettingsUseCase(repository, auditLog), repository, auditLog };
}

describe('UpdateSystemSettingsUseCase', () => {
  it('rejects an entry with an empty key', async () => {
    const { useCase, repository } = buildUseCase();

    await expect(
      useCase.execute({
        settings: [{ key: '  ', value: 'x', category: 'tax' }],
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(InvalidSystemSettingError);
    expect(repository.upsertMany).not.toHaveBeenCalled();
  });

  it('rejects an entry with an empty category', async () => {
    const { useCase } = buildUseCase();

    await expect(
      useCase.execute({
        settings: [{ key: 'tax.rate', value: 0.16, category: '' }],
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(InvalidSystemSettingError);
  });

  it('upserts valid entries and records an audit entry with the touched keys', async () => {
    const { useCase, repository, auditLog } = buildUseCase();

    const result = await useCase.execute({
      settings: [
        { key: 'tax.rate', value: 0.16, category: 'tax' },
        { key: 'policy.terms_url', value: '/terminos', category: 'policies' },
      ],
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(repository.upsertMany).toHaveBeenCalled();
    expect(result.map((setting) => setting.key)).toEqual(['tax.rate', 'policy.terms_url']);
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'site_config.system_settings_updated',
        metadata: { keys: ['tax.rate', 'policy.terms_url'] },
      }),
    );
  });
});
