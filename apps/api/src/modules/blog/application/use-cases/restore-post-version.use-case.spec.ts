import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { PostEntity } from '../../domain/entities/post.entity';
import { PostVersionEntity } from '../../domain/entities/post-version.entity';
import {
  PostNotFoundError,
  PostSlugAlreadyExistsError,
  PostVersionNotFoundError,
} from '../../domain/errors/blog.errors';
import type { PostRepositoryPort } from '../../domain/ports/post.repository.port';
import type { PostVersionRepositoryPort } from '../../domain/ports/post-version.repository.port';
import { PostStatus } from '../../domain/value-objects/post-enums';
import type { BlogCacheService } from '../services/blog-cache.service';
import { RestorePostVersionUseCase } from './restore-post-version.use-case';

function buildPost(overrides: Partial<{ slug: string; status: PostStatus }> = {}): PostEntity {
  return new PostEntity({
    id: 'post-1',
    title: 'Cómo cuidar tu jersey (actual)',
    slug: overrides.slug ?? 'cuidado-jersey',
    excerpt: null,
    content: '<p>actual</p>',
    featuredImage: null,
    status: overrides.status ?? PostStatus.PUBLISHED,
    publishedAt: new Date(),
    seoTitle: null,
    seoDescription: null,
    author: { id: 'author-1', firstName: 'Ana', lastName: 'Pérez' },
    categories: [],
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildVersion(overrides: Partial<{ slug: string }> = {}): PostVersionEntity {
  return new PostVersionEntity({
    id: 'version-1',
    postId: 'post-1',
    versionNumber: 1,
    snapshot: {
      title: 'Cómo cuidar tu jersey (viejo)',
      slug: overrides.slug ?? 'cuidado-jersey',
      status: PostStatus.DRAFT,
      excerpt: null,
      content: '<p>viejo</p>',
      featuredImage: null,
      seoTitle: null,
      seoDescription: null,
      categoryIds: [],
      tagIds: [],
    },
    createdAt: new Date(),
  });
}

function buildUseCase(
  options: {
    post?: PostEntity | null;
    version?: PostVersionEntity | null;
    slugConflict?: PostEntity | null;
  } = {},
) {
  const posts: jest.Mocked<PostRepositoryPort> = {
    findById: jest.fn().mockResolvedValue(options.post === undefined ? buildPost() : options.post),
    findBySlug: jest.fn().mockResolvedValue(options.slugConflict ?? null),
    findMany: jest.fn(),
    findManyPublished: jest.fn(),
    findPublishedCandidatesForRelated: jest.fn(),
    create: jest.fn(),
    update: jest
      .fn()
      .mockImplementation((_id, data) => Promise.resolve(buildPost({ slug: data.slug }))),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    promoteDuePosts: jest.fn().mockResolvedValue([]),
  };
  const versions: jest.Mocked<PostVersionRepositoryPort> = {
    findByPostAndNumber: jest
      .fn()
      .mockResolvedValue(options.version === undefined ? buildVersion() : options.version),
    findMany: jest.fn(),
    getNextVersionNumber: jest.fn().mockResolvedValue(2),
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
    useCase: new RestorePostVersionUseCase(posts, versions, cache, auditLog),
    posts,
    versions,
    cache,
    auditLog,
  };
}

describe('RestorePostVersionUseCase', () => {
  it('throws PostNotFoundError when the post does not exist', async () => {
    const { useCase } = buildUseCase({ post: null });

    await expect(
      useCase.execute({
        postId: 'post-1',
        versionNumber: 1,
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(PostNotFoundError);
  });

  it('throws PostVersionNotFoundError when the version does not exist', async () => {
    const { useCase } = buildUseCase({ version: null });

    await expect(
      useCase.execute({
        postId: 'post-1',
        versionNumber: 99,
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(PostVersionNotFoundError);
  });

  it('applies the snapshot content via update and creates a new version', async () => {
    const { useCase, posts, versions } = buildUseCase();

    await useCase.execute({
      postId: 'post-1',
      versionNumber: 1,
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(posts.update).toHaveBeenCalledWith(
      'post-1',
      expect.objectContaining({ title: 'Cómo cuidar tu jersey (viejo)' }),
    );
    expect(versions.create).toHaveBeenCalled();
  });

  it('throws PostSlugAlreadyExistsError when the snapshot slug is now taken by another post', async () => {
    const conflictingPost = buildPost({ slug: 'otro-slug' });
    const { useCase } = buildUseCase({
      version: buildVersion({ slug: 'otro-slug' }),
      slugConflict: conflictingPost,
    });

    await expect(
      useCase.execute({
        postId: 'post-1',
        versionNumber: 1,
        actorUserId: 'admin-1',
        ipAddress: null,
      }),
    ).rejects.toThrow(PostSlugAlreadyExistsError);
  });

  it('invalidates the cache when the post was published', async () => {
    const { useCase, cache } = buildUseCase({ post: buildPost({ status: PostStatus.PUBLISHED }) });

    await useCase.execute({
      postId: 'post-1',
      versionNumber: 1,
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(cache.invalidatePost).toHaveBeenCalledWith('cuidado-jersey');
  });

  it('records an audit log entry referencing the restored version', async () => {
    const { useCase, auditLog } = buildUseCase();

    await useCase.execute({
      postId: 'post-1',
      versionNumber: 1,
      actorUserId: 'admin-1',
      ipAddress: null,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'blog.post.version_restored',
        metadata: expect.objectContaining({ restoredFrom: 1 }),
      }),
    );
  });
});
