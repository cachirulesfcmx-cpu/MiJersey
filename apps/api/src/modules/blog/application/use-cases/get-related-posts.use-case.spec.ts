import { PostEntity } from '../../domain/entities/post.entity';
import { PostNotFoundError } from '../../domain/errors/blog.errors';
import type { PostRepositoryPort } from '../../domain/ports/post.repository.port';
import { PostStatus } from '../../domain/value-objects/post-enums';
import { GetRelatedPostsUseCase } from './get-related-posts.use-case';

function buildPost(overrides: {
  id: string;
  status?: PostStatus;
  categories?: { id: string; name: string; slug: string }[];
  tags?: { id: string; name: string; slug: string }[];
  publishedAt?: Date;
}): PostEntity {
  return new PostEntity({
    id: overrides.id,
    title: `Post ${overrides.id}`,
    slug: `post-${overrides.id}`,
    excerpt: null,
    content: '<p>...</p>',
    featuredImage: null,
    status: overrides.status ?? PostStatus.PUBLISHED,
    publishedAt: overrides.publishedAt ?? new Date('2026-01-01'),
    seoTitle: null,
    seoDescription: null,
    author: { id: 'author-1', firstName: 'Ana', lastName: 'Pérez' },
    categories: overrides.categories ?? [],
    tags: overrides.tags ?? [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(post: PostEntity | null, candidates: PostEntity[] = []) {
  const posts: jest.Mocked<PostRepositoryPort> = {
    findById: jest.fn(),
    findBySlug: jest.fn().mockResolvedValue(post),
    findMany: jest.fn(),
    findManyPublished: jest.fn(),
    findPublishedCandidatesForRelated: jest.fn().mockResolvedValue(candidates),
    create: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    promoteDuePosts: jest.fn().mockResolvedValue([]),
  };

  return { useCase: new GetRelatedPostsUseCase(posts), posts };
}

const CAT_A = { id: 'cat-a', name: 'Cuidado', slug: 'cuidado' };
const CAT_B = { id: 'cat-b', name: 'Historia', slug: 'historia' };
const TAG_X = { id: 'tag-x', name: 'Retro', slug: 'retro' };

describe('GetRelatedPostsUseCase', () => {
  it('throws PostNotFoundError when the slug does not exist', async () => {
    const { useCase } = buildUseCase(null);

    await expect(useCase.execute('missing')).rejects.toThrow(PostNotFoundError);
  });

  it('throws PostNotFoundError when the post is not published', async () => {
    const { useCase } = buildUseCase(buildPost({ id: '1', status: PostStatus.DRAFT }));

    await expect(useCase.execute('post-1')).rejects.toThrow(PostNotFoundError);
  });

  it('returns an empty list when the post has no categories or tags', async () => {
    const { useCase, posts } = buildUseCase(buildPost({ id: '1' }));

    const result = await useCase.execute('post-1');

    expect(result).toEqual([]);
    expect(posts.findPublishedCandidatesForRelated).not.toHaveBeenCalled();
  });

  it('ranks candidates by number of shared categories/tags, most first', async () => {
    const source = buildPost({ id: '1', categories: [CAT_A], tags: [TAG_X] });
    const twoMatches = buildPost({ id: '2', categories: [CAT_A], tags: [TAG_X] });
    const oneMatch = buildPost({ id: '3', categories: [CAT_A] });
    const noMatch = buildPost({ id: '4', categories: [CAT_B] });

    const { useCase } = buildUseCase(source, [oneMatch, noMatch, twoMatches]);

    const result = await useCase.execute('post-1');

    expect(result.map((post) => post.id)).toEqual(['2', '3']);
  });

  it('breaks ties by most recent publishedAt', async () => {
    const source = buildPost({ id: '1', categories: [CAT_A] });
    const older = buildPost({ id: '2', categories: [CAT_A], publishedAt: new Date('2026-01-01') });
    const newer = buildPost({ id: '3', categories: [CAT_A], publishedAt: new Date('2026-06-01') });

    const { useCase } = buildUseCase(source, [older, newer]);

    const result = await useCase.execute('post-1');

    expect(result.map((post) => post.id)).toEqual(['3', '2']);
  });
});
