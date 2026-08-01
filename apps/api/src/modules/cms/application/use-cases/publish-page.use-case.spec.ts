import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { PageEntity } from '../../domain/entities/page.entity';
import { PageNotFoundError } from '../../domain/errors/cms.errors';
import type { PageRepositoryPort } from '../../domain/ports/page.repository.port';
import type { PageVersionRepositoryPort } from '../../domain/ports/page-version.repository.port';
import { PageStatus } from '../../domain/value-objects/page-enums';
import type { CmsCacheService } from '../services/cms-cache.service';
import { PublishPageUseCase } from './publish-page.use-case';

function buildPage(
  status: PageStatus = PageStatus.DRAFT,
  publishedAt: Date | null = null,
): PageEntity {
  return new PageEntity({
    id: 'page-1',
    title: 'About',
    slug: 'about',
    status,
    template: 'default',
    seoTitle: null,
    seoDescription: null,
    publishedAt,
    blocks: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(existing: PageEntity | null = buildPage()) {
  const pages: jest.Mocked<PageRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(existing),
    findBySlug: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest
      .fn()
      .mockImplementation((_id: string, status: PageStatus, publishedAt: Date) =>
        Promise.resolve(buildPage(status, publishedAt)),
      ),
    delete: jest.fn(),
  };

  const versions: jest.Mocked<PageVersionRepositoryPort> = {
    findByPageAndNumber: jest.fn(),
    findMany: jest.fn(),
    getNextVersionNumber: jest.fn().mockResolvedValue(1),
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
    useCase: new PublishPageUseCase(pages, versions, cache, auditLog),
    pages,
    versions,
    cache,
    auditLog,
  };
}

describe('PublishPageUseCase', () => {
  it('throws PageNotFoundError when the page does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(
      useCase.execute({ id: 'page-1', actorUserId: 'admin-1', ipAddress: null }),
    ).rejects.toThrow(PageNotFoundError);
  });

  it('publishes immediately when no publishAt is given', async () => {
    const { useCase, pages } = buildUseCase();

    await useCase.execute({ id: 'page-1', actorUserId: 'admin-1', ipAddress: null });

    expect(pages.updateStatus).toHaveBeenCalledWith(
      'page-1',
      PageStatus.PUBLISHED,
      expect.any(Date),
    );
  });

  it('schedules the page when publishAt is in the future', async () => {
    const { useCase, pages } = buildUseCase();
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);

    await useCase.execute({
      id: 'page-1',
      publishAt: futureDate,
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(pages.updateStatus).toHaveBeenCalledWith('page-1', PageStatus.SCHEDULED, futureDate);
  });

  it('publishes immediately when publishAt is already in the past', async () => {
    const { useCase, pages } = buildUseCase();
    const pastDate = new Date(Date.now() - 60 * 60 * 1000);

    await useCase.execute({
      id: 'page-1',
      publishAt: pastDate,
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(pages.updateStatus).toHaveBeenCalledWith(
      'page-1',
      PageStatus.PUBLISHED,
      expect.any(Date),
    );
  });

  it('invalidates the public cache and records a version and audit entry', async () => {
    const { useCase, cache, versions, auditLog } = buildUseCase();

    await useCase.execute({ id: 'page-1', actorUserId: 'admin-1', ipAddress: null });

    expect(cache.invalidatePage).toHaveBeenCalledWith('about');
    expect(versions.create).toHaveBeenCalled();
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'cms.page.published' }),
    );
  });
});
