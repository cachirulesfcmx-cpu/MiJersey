import { PostEntity } from '../../domain/entities/post.entity';
import { PostNotFoundError } from '../../domain/errors/blog.errors';
import type { PostRepositoryPort } from '../../domain/ports/post.repository.port';
import { PostStatus } from '../../domain/value-objects/post-enums';
import type { BlogCacheService } from '../services/blog-cache.service';
import { GetPublishedPostUseCase } from './get-published-post.use-case';

function buildPost(overrides: Partial<{ status: PostStatus; publishedAt: Date | null }> = {}) {
  return new PostEntity({
    id: 'post-1',
    title: 'Cómo cuidar tu jersey',
    slug: 'cuidado-jersey',
    excerpt: null,
    content: '<p>...</p>',
    featuredImage: null,
    status: overrides.status ?? PostStatus.PUBLISHED,
    publishedAt:
      overrides.publishedAt === undefined ? new Date('2026-01-01') : overrides.publishedAt,
    seoTitle: null,
    seoDescription: null,
    author: { id: 'author-1', firstName: 'Ana', lastName: 'Pérez' },
    categories: [],
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(post: PostEntity | null) {
  const posts: jest.Mocked<PostRepositoryPort> = {
    findById: jest.fn(),
    findBySlug: jest.fn().mockResolvedValue(post),
    findMany: jest.fn(),
    findManyPublished: jest.fn(),
    findPublishedCandidatesForRelated: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    promoteDuePosts: jest.fn().mockResolvedValue([]),
  };
  const cache = {
    getPost: jest.fn().mockResolvedValue(null),
    setPost: jest.fn().mockResolvedValue(undefined),
    invalidatePost: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<BlogCacheService>;

  return { useCase: new GetPublishedPostUseCase(posts, cache), posts, cache };
}

describe('GetPublishedPostUseCase', () => {
  it('returns the cached view without hitting the repository', async () => {
    const { useCase, posts, cache } = buildUseCase(null);
    (cache.getPost as jest.Mock).mockResolvedValue(JSON.stringify({ slug: 'cuidado-jersey' }));

    const result = await useCase.execute('cuidado-jersey');

    expect(result).toEqual({ slug: 'cuidado-jersey' });
    expect(posts.findBySlug).not.toHaveBeenCalled();
  });

  it('promotes due SCHEDULED posts before resolving and invalidates their cache', async () => {
    const { useCase, posts, cache } = buildUseCase(buildPost({ status: PostStatus.PUBLISHED }));
    (posts.promoteDuePosts as jest.Mock).mockResolvedValue(['other-post']);

    await useCase.execute('cuidado-jersey');

    expect(posts.promoteDuePosts).toHaveBeenCalled();
    expect(cache.invalidatePost).toHaveBeenCalledWith('other-post');
  });

  it('returns a PUBLISHED post and populates the cache', async () => {
    const { useCase, cache } = buildUseCase(buildPost({ status: PostStatus.PUBLISHED }));

    const result = await useCase.execute('cuidado-jersey');

    expect(result.slug).toBe('cuidado-jersey');
    expect(cache.setPost).toHaveBeenCalledWith('cuidado-jersey', expect.any(String));
  });

  it('throws PostNotFoundError for a DRAFT post', async () => {
    const { useCase } = buildUseCase(buildPost({ status: PostStatus.DRAFT, publishedAt: null }));

    await expect(useCase.execute('cuidado-jersey')).rejects.toThrow(PostNotFoundError);
  });

  it('throws PostNotFoundError for a SCHEDULED post still in the future', async () => {
    const futureDate = new Date(Date.now() + 60_000);
    const { useCase } = buildUseCase(
      buildPost({ status: PostStatus.SCHEDULED, publishedAt: futureDate }),
    );

    await expect(useCase.execute('cuidado-jersey')).rejects.toThrow(PostNotFoundError);
  });

  it('throws PostNotFoundError when the slug does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(useCase.execute('missing')).rejects.toThrow(PostNotFoundError);
  });
});
