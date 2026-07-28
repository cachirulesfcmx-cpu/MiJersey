import type { RedirectRepositoryPort } from '../../domain/ports/redirect.repository.port';
import { SeoEntityType } from '../../domain/value-objects/seo-enums';
import { SeoRedirectService } from './seo-redirect.service';

function buildService() {
  const redirects: jest.Mocked<RedirectRepositoryPort> = {
    findById: jest.fn(),
    findByFromPath: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    upsertByFromPath: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn(),
  };

  return { service: new SeoRedirectService(redirects), redirects };
}

describe('SeoRedirectService', () => {
  it('creates a permanent redirect from the old path to the new one when the slug changes', async () => {
    const { service, redirects } = buildService();

    await service.recordSlugChange(SeoEntityType.PRODUCT, 'old-slug', 'new-slug');

    expect(redirects.upsertByFromPath).toHaveBeenCalledWith({
      fromPath: '/products/old-slug',
      toPath: '/products/new-slug',
      statusCode: 301,
    });
  });

  it('maps each entity type to its own storefront path prefix', async () => {
    const { service, redirects } = buildService();

    await service.recordSlugChange(SeoEntityType.BRAND, 'nike', 'nike-inc');

    expect(redirects.upsertByFromPath).toHaveBeenCalledWith({
      fromPath: '/brands/nike',
      toPath: '/brands/nike-inc',
      statusCode: 301,
    });
  });

  it('does nothing when the slug did not actually change', async () => {
    const { service, redirects } = buildService();

    await service.recordSlugChange(SeoEntityType.CATEGORY, 'same', 'same');

    expect(redirects.upsertByFromPath).not.toHaveBeenCalled();
  });
});
