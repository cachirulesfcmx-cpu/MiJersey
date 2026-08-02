import { SiteConfigurationEntity } from '../../domain/entities/site-configuration.entity';
import type { SiteConfigurationRepositoryPort } from '../../domain/ports/site-configuration.repository.port';
import type { SiteConfigCacheService } from '../services/site-config-cache.service';
import { GetSiteConfigurationUseCase } from './get-site-configuration.use-case';

function buildConfig(): SiteConfigurationEntity {
  return new SiteConfigurationEntity({
    id: 'config-1',
    siteName: 'MiJersey',
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
    getConfiguration: jest.fn().mockResolvedValue(buildConfig()),
    update: jest.fn(),
  };
  const cache = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    invalidate: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SiteConfigCacheService>;

  return { useCase: new GetSiteConfigurationUseCase(repository, cache), repository, cache };
}

describe('GetSiteConfigurationUseCase', () => {
  it('returns the cached value without hitting the repository when present', async () => {
    const { useCase, repository, cache } = buildUseCase();
    (cache.get as jest.Mock).mockResolvedValue(JSON.stringify({ siteName: 'Cached' }));

    const result = await useCase.execute();

    expect(repository.getConfiguration).not.toHaveBeenCalled();
    expect(result.siteName).toBe('Cached');
  });

  it('falls back to the repository and seeds the cache on a miss', async () => {
    const { useCase, repository, cache } = buildUseCase();

    const result = await useCase.execute();

    expect(repository.getConfiguration).toHaveBeenCalled();
    expect(result.siteName).toBe('MiJersey');
    expect(cache.set).toHaveBeenCalledWith(expect.stringContaining('"siteName":"MiJersey"'));
  });
});
