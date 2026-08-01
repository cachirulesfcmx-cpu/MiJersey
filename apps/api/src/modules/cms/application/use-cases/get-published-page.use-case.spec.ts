import { PageEntity } from '../../domain/entities/page.entity';
import { PageNotFoundError } from '../../domain/errors/cms.errors';
import type { PageRepositoryPort } from '../../domain/ports/page.repository.port';
import { PageStatus } from '../../domain/value-objects/page-enums';
import type { CmsCacheService } from '../services/cms-cache.service';
import { GetPublishedPageUseCase } from './get-published-page.use-case';

function buildPage(overrides: Partial<{ status: PageStatus; publishedAt: Date | null }> = {}) {
  return new PageEntity({
    id: 'page-1',
    title: 'About',
    slug: 'about',
    status: overrides.status ?? PageStatus.PUBLISHED,
    template: 'default',
    seoTitle: null,
    seoDescription: null,
    publishedAt:
      overrides.publishedAt === undefined ? new Date('2026-01-01') : overrides.publishedAt,
    blocks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(page: PageEntity | null) {
  const pages: jest.Mocked<PageRepositoryPort> = {
    findById: jest.fn(),
    findBySlug: jest.fn().mockResolvedValue(page),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest
      .fn()
      .mockImplementation((id, status, publishedAt) =>
        Promise.resolve(buildPage({ status, publishedAt })),
      ),
    delete: jest.fn(),
  };
  const cache = {
    getPage: jest.fn().mockResolvedValue(null),
    setPage: jest.fn().mockResolvedValue(undefined),
    invalidatePage: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<CmsCacheService>;

  return { useCase: new GetPublishedPageUseCase(pages, cache), pages, cache };
}

describe('GetPublishedPageUseCase', () => {
  it('returns the cached view without hitting the repository', async () => {
    const { useCase, pages, cache } = buildUseCase(null);
    (cache.getPage as jest.Mock).mockResolvedValue(JSON.stringify({ slug: 'about' }));

    const result = await useCase.execute('about');

    expect(result).toEqual({ slug: 'about' });
    expect(pages.findBySlug).not.toHaveBeenCalled();
  });

  it('returns a PUBLISHED page and populates the cache', async () => {
    const { useCase, cache } = buildUseCase(buildPage({ status: PageStatus.PUBLISHED }));

    const result = await useCase.execute('about');

    expect(result.slug).toBe('about');
    expect(cache.setPage).toHaveBeenCalledWith('about', expect.any(String));
  });

  it('promotes a SCHEDULED page whose date already arrived to PUBLISHED', async () => {
    const pastDate = new Date(Date.now() - 60_000);
    const { useCase, pages } = buildUseCase(
      buildPage({ status: PageStatus.SCHEDULED, publishedAt: pastDate }),
    );

    const result = await useCase.execute('about');

    expect(pages.updateStatus).toHaveBeenCalledWith('page-1', PageStatus.PUBLISHED, pastDate);
    expect(result.status).toBe(PageStatus.PUBLISHED);
  });

  it('throws PageNotFoundError for a SCHEDULED page whose date is still in the future', async () => {
    const futureDate = new Date(Date.now() + 60_000);
    const { useCase } = buildUseCase(
      buildPage({ status: PageStatus.SCHEDULED, publishedAt: futureDate }),
    );

    await expect(useCase.execute('about')).rejects.toThrow(PageNotFoundError);
  });

  it('throws PageNotFoundError for a DRAFT page', async () => {
    const { useCase } = buildUseCase(buildPage({ status: PageStatus.DRAFT, publishedAt: null }));

    await expect(useCase.execute('about')).rejects.toThrow(PageNotFoundError);
  });

  it('throws PageNotFoundError when the slug does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(useCase.execute('missing')).rejects.toThrow(PageNotFoundError);
  });
});
