import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { SiteConfigurationEntity } from '../../domain/entities/site-configuration.entity';
import { InvalidSiteConfigurationError } from '../../domain/errors/site-config.errors';
import type { SiteConfigurationRepositoryPort } from '../../domain/ports/site-configuration.repository.port';
import type { SiteConfigCacheService } from '../services/site-config-cache.service';
import { UpdateSiteConfigurationUseCase } from './update-site-configuration.use-case';

function buildConfig(siteName = 'Nueva tienda'): SiteConfigurationEntity {
  return new SiteConfigurationEntity({
    id: 'config-1',
    siteName,
    defaultDomain: 'mijersey.com',
    defaultLanguage: 'es',
    defaultCurrency: 'MXN',
    timezone: 'America/Mexico_City',
    locale: 'es-MX',
    supportEmail: 'soporte@mijersey.com',
    supportPhone: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase() {
  const repository: jest.Mocked<SiteConfigurationRepositoryPort> = {
    getConfiguration: jest.fn(),
    update: jest.fn().mockResolvedValue(buildConfig()),
  };
  const cache = {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SiteConfigCacheService>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new UpdateSiteConfigurationUseCase(repository, cache, auditLog),
    repository,
    cache,
    auditLog,
  };
}

describe('UpdateSiteConfigurationUseCase', () => {
  it('rejects an invalid field before touching the repository', async () => {
    const { useCase, repository } = buildUseCase();

    await expect(
      useCase.execute({ defaultCurrency: 'mxn', actorUserId: 'admin-1', ipAddress: null }),
    ).rejects.toThrow(InvalidSiteConfigurationError);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('persists valid changes and reseeds the cache immediately', async () => {
    const { useCase, repository, cache } = buildUseCase();

    await useCase.execute({ siteName: 'Nueva tienda', actorUserId: 'admin-1', ipAddress: null });

    expect(repository.update).toHaveBeenCalledWith({ siteName: 'Nueva tienda' });
    expect(cache.set).toHaveBeenCalledWith(expect.stringContaining('"siteName":"Nueva tienda"'));
  });

  it('records an audit entry listing the touched fields', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({
      siteName: 'Nueva tienda',
      timezone: 'America/Mexico_City',
      actorUserId: 'admin-1',
      ipAddress: '127.0.0.1',
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        action: 'site_config.updated',
        metadata: { updatedFields: ['siteName', 'timezone'] },
      }),
    );
  });
});
