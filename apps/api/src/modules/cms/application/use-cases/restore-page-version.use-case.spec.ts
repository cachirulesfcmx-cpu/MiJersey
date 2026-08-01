import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { PageEntity } from '../../domain/entities/page.entity';
import { PageVersionEntity } from '../../domain/entities/page-version.entity';
import {
  PageNotFoundError,
  PageSlugAlreadyExistsError,
  PageVersionNotFoundError,
} from '../../domain/errors/cms.errors';
import type { PageRepositoryPort } from '../../domain/ports/page.repository.port';
import type { PageVersionRepositoryPort } from '../../domain/ports/page-version.repository.port';
import { PageStatus } from '../../domain/value-objects/page-enums';
import type { CmsCacheService } from '../services/cms-cache.service';
import { RestorePageVersionUseCase } from './restore-page-version.use-case';

function buildPage(overrides: Partial<{ slug: string; status: PageStatus }> = {}): PageEntity {
  return new PageEntity({
    id: 'page-1',
    title: 'About (current)',
    slug: overrides.slug ?? 'about',
    status: overrides.status ?? PageStatus.PUBLISHED,
    template: 'default',
    seoTitle: null,
    seoDescription: null,
    publishedAt: new Date(),
    blocks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildVersion(overrides: Partial<{ slug: string }> = {}): PageVersionEntity {
  return new PageVersionEntity({
    id: 'version-1',
    pageId: 'page-1',
    versionNumber: 1,
    snapshot: {
      title: 'About (old)',
      slug: overrides.slug ?? 'about',
      status: PageStatus.DRAFT,
      template: 'default',
      seoTitle: null,
      seoDescription: null,
      blocks: [],
    },
    createdAt: new Date(),
  });
}

function buildUseCase(
  options: {
    page?: PageEntity | null;
    version?: PageVersionEntity | null;
    slugConflict?: PageEntity | null;
  } = {},
) {
  const pages: jest.Mocked<PageRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(options.page === undefined ? buildPage() : options.page),
    findBySlug: jest.fn().mockResolvedValue(options.slugConflict ?? null),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest
      .fn()
      .mockImplementation((_id, data) => Promise.resolve(buildPage({ slug: data.slug }))),
    updateStatus: jest.fn(),
    delete: jest.fn(),
  };
  const versions: jest.Mocked<PageVersionRepositoryPort> = {
    findByPageAndNumber: jest
      .fn()
      .mockResolvedValue(options.version === undefined ? buildVersion() : options.version),
    findMany: jest.fn(),
    getNextVersionNumber: jest.fn().mockResolvedValue(2),
    create: jest.fn().mockResolvedValue({}),
  };
  const cache = {
    getPage: jest.fn(),
    setPage: jest.fn(),
    invalidatePage: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<CmsCacheService>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new RestorePageVersionUseCase(pages, versions, cache, auditLog),
    pages,
    versions,
    cache,
    auditLog,
  };
}

describe('RestorePageVersionUseCase', () => {
  it('throws PageNotFoundError when the page does not exist', async () => {
    const { useCase } = buildUseCase({ page: null });

    await expect(
      useCase.execute({
        pageId: 'page-1',
        versionNumber: 1,
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(PageNotFoundError);
  });

  it('throws PageVersionNotFoundError when the version does not exist', async () => {
    const { useCase } = buildUseCase({ version: null });

    await expect(
      useCase.execute({
        pageId: 'page-1',
        versionNumber: 99,
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(PageVersionNotFoundError);
  });

  it('applies the snapshot content via update and creates a new version', async () => {
    const { useCase, pages, versions } = buildUseCase();

    await useCase.execute({
      pageId: 'page-1',
      versionNumber: 1,
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(pages.update).toHaveBeenCalledWith(
      'page-1',
      expect.objectContaining({ title: 'About (old)' }),
    );
    expect(versions.create).toHaveBeenCalled();
  });

  it('throws PageSlugAlreadyExistsError when the snapshot slug is now taken by another page', async () => {
    const conflictingPage = buildPage({ slug: 'other-slug' });
    const { useCase } = buildUseCase({
      version: buildVersion({ slug: 'other-slug' }),
      slugConflict: conflictingPage,
    });

    await expect(
      useCase.execute({
        pageId: 'page-1',
        versionNumber: 1,
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(PageSlugAlreadyExistsError);
  });

  it('invalidates the cache when the page was published', async () => {
    const { useCase, cache } = buildUseCase({ page: buildPage({ status: PageStatus.PUBLISHED }) });

    await useCase.execute({
      pageId: 'page-1',
      versionNumber: 1,
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(cache.invalidatePage).toHaveBeenCalledWith('about');
  });

  it('records an audit log entry referencing the restored version', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({
      pageId: 'page-1',
      versionNumber: 1,
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'cms.page.version_restored',
        metadata: expect.objectContaining({ restoredFrom: 1 }),
      }),
    );
  });
});
