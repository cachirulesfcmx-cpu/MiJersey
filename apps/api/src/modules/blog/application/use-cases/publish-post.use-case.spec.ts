import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { PostEntity } from '../../domain/entities/post.entity';
import { PostNotFoundError } from '../../domain/errors/blog.errors';
import type { PostRepositoryPort } from '../../domain/ports/post.repository.port';
import type { PostVersionRepositoryPort } from '../../domain/ports/post-version.repository.port';
import { PostStatus } from '../../domain/value-objects/post-enums';
import type { BlogCacheService } from '../services/blog-cache.service';
import { PublishPostUseCase } from './publish-post.use-case';

function buildPost(
  status: PostStatus = PostStatus.DRAFT,
  publishedAt: Date | null = null,
): PostEntity {
  return new PostEntity({
    id: 'post-1',
    title: 'Cómo cuidar tu jersey',
    slug: 'cuidado-jersey',
    excerpt: null,
    content: '<p>...</p>',
    featuredImage: null,
    status,
    publishedAt,
    seoTitle: null,
    seoDescription: null,
    author: { id: 'author-1', firstName: 'Ana', lastName: 'Pérez' },
    categories: [],
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(existing: PostEntity | null = buildPost()) {
  const posts: jest.Mocked<PostRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(existing),
    findBySlug: jest.fn(),
    findMany: jest.fn(),
    findManyPublished: jest.fn(),
    findPublishedCandidatesForRelated: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest
      .fn()
      .mockImplementation((_id: string, status: PostStatus, publishedAt: Date) =>
        Promise.resolve(buildPost(status, publishedAt)),
      ),
    delete: jest.fn(),
    promoteDuePosts: jest.fn().mockResolvedValue([]),
  };

  const versions: jest.Mocked<PostVersionRepositoryPort> = {
    findByPostAndNumber: jest.fn(),
    findMany: jest.fn(),
    getNextVersionNumber: jest.fn().mockResolvedValue(1),
    create: jest.fn().mockResolvedValue({}),
  };
  const cache = {
    getPost: jest.fn(),
    setPost: jest.fn(),
    invalidatePost: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<BlogCacheService>;
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new PublishPostUseCase(posts, versions, cache, auditLog),
    posts,
    versions,
    cache,
    auditLog,
  };
}

describe('PublishPostUseCase', () => {
  it('throws PostNotFoundError when the post does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(
      useCase.execute({ id: 'post-1', actorUserId: 'admin-1', ipAddress: null }),
    ).rejects.toThrow(PostNotFoundError);
  });

  it('publishes immediately when no publishAt is given', async () => {
    const { useCase, posts } = buildUseCase();

    await useCase.execute({ id: 'post-1', actorUserId: 'admin-1', ipAddress: null });

    expect(posts.updateStatus).toHaveBeenCalledWith(
      'post-1',
      PostStatus.PUBLISHED,
      expect.any(Date),
    );
  });

  it('schedules the post when publishAt is in the future', async () => {
    const { useCase, posts } = buildUseCase();
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);

    await useCase.execute({
      id: 'post-1',
      publishAt: futureDate,
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(posts.updateStatus).toHaveBeenCalledWith('post-1', PostStatus.SCHEDULED, futureDate);
  });

  it('publishes immediately when publishAt is already in the past', async () => {
    const { useCase, posts } = buildUseCase();
    const pastDate = new Date(Date.now() - 60 * 60 * 1000);

    await useCase.execute({
      id: 'post-1',
      publishAt: pastDate,
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(posts.updateStatus).toHaveBeenCalledWith(
      'post-1',
      PostStatus.PUBLISHED,
      expect.any(Date),
    );
  });

  it('invalidates the public cache and records a version and audit entry', async () => {
    const { useCase, cache, versions, auditLog } = buildUseCase();

    await useCase.execute({ id: 'post-1', actorUserId: 'admin-1', ipAddress: null });

    expect(cache.invalidatePost).toHaveBeenCalledWith('cuidado-jersey');
    expect(versions.create).toHaveBeenCalled();
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'blog.post.published' }),
    );
  });
});
