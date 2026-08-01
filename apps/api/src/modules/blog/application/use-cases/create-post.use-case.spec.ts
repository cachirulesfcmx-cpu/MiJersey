import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { BlogCategoryEntity } from '../../domain/entities/blog-category.entity';
import { BlogTagEntity } from '../../domain/entities/blog-tag.entity';
import { PostEntity } from '../../domain/entities/post.entity';
import {
  BlogCategoryNotFoundError,
  PostSlugAlreadyExistsError,
} from '../../domain/errors/blog.errors';
import type { BlogCategoryRepositoryPort } from '../../domain/ports/blog-category.repository.port';
import type { BlogTagRepositoryPort } from '../../domain/ports/blog-tag.repository.port';
import type { CreatePostData, PostRepositoryPort } from '../../domain/ports/post.repository.port';
import type { PostVersionRepositoryPort } from '../../domain/ports/post-version.repository.port';
import { PostStatus } from '../../domain/value-objects/post-enums';
import { CreatePostUseCase } from './create-post.use-case';

function buildCreatedPost(data: CreatePostData): PostEntity {
  return new PostEntity({
    id: 'post-1',
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt ?? null,
    content: data.content,
    featuredImage: data.featuredImage ?? null,
    status: PostStatus.DRAFT,
    publishedAt: null,
    seoTitle: data.seoTitle ?? null,
    seoDescription: data.seoDescription ?? null,
    author: { id: data.authorId, firstName: 'Ana', lastName: 'Pérez' },
    categories: [],
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function buildUseCase(
  options: { existingSlug?: PostEntity | null; existingCategoryIds?: string[] } = {},
) {
  const posts: jest.Mocked<PostRepositoryPort> = {
    findById: jest.fn(),
    findBySlug: jest.fn().mockResolvedValue(options.existingSlug ?? null),
    findMany: jest.fn(),
    findManyPublished: jest.fn(),
    findPublishedCandidatesForRelated: jest.fn(),
    create: jest.fn().mockImplementation((data) => Promise.resolve(buildCreatedPost(data))),
    update: jest.fn(),
    updateStatus: jest.fn(),
    delete: jest.fn(),
    promoteDuePosts: jest.fn().mockResolvedValue([]),
  };
  const versions: jest.Mocked<PostVersionRepositoryPort> = {
    findByPostAndNumber: jest.fn(),
    findMany: jest.fn(),
    getNextVersionNumber: jest.fn().mockResolvedValue(1),
    create: jest.fn().mockResolvedValue({}),
  };
  const existingCategoryIds = options.existingCategoryIds ?? [];
  const categories: jest.Mocked<BlogCategoryRepositoryPort> = {
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findByIds: jest.fn().mockImplementation((ids: string[]) =>
      Promise.resolve(
        ids
          .filter((id) => existingCategoryIds.includes(id))
          .map(
            (id) =>
              new BlogCategoryEntity({
                id,
                name: id,
                slug: id,
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
          ),
      ),
    ),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const tags: jest.Mocked<BlogTagRepositoryPort> = {
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findByIds: jest.fn().mockResolvedValue([] as BlogTagEntity[]),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const auditLog: jest.Mocked<AuditLogRepositoryPort> = {
    record: jest.fn().mockResolvedValue(undefined),
  };

  return {
    useCase: new CreatePostUseCase(posts, versions, categories, tags, auditLog),
    posts,
    versions,
    categories,
    tags,
    auditLog,
  };
}

const BASE_INPUT = {
  title: 'Cómo cuidar tu jersey',
  slug: 'cuidado-jersey',
  content: '<p>...</p>',
  authorId: 'author-1',
  categoryIds: [] as string[],
  tagIds: [] as string[],
  actorUserId: 'admin-1',
  ipAddress: null,
};

describe('CreatePostUseCase', () => {
  it('throws PostSlugAlreadyExistsError when the slug is taken', async () => {
    const { useCase } = buildUseCase({ existingSlug: buildCreatedPost({ ...BASE_INPUT }) });

    await expect(useCase.execute(BASE_INPUT)).rejects.toThrow(PostSlugAlreadyExistsError);
  });

  it('throws BlogCategoryNotFoundError when an assigned category does not exist', async () => {
    const { useCase } = buildUseCase({ existingCategoryIds: [] });

    await expect(
      useCase.execute({ ...BASE_INPUT, categoryIds: ['missing-category'] }),
    ).rejects.toThrow(BlogCategoryNotFoundError);
  });

  it('creates the post, records version #1, and audits the creation', async () => {
    const { useCase, posts, versions, auditLog } = buildUseCase({
      existingCategoryIds: ['cat-a'],
    });

    const post = await useCase.execute({ ...BASE_INPUT, categoryIds: ['cat-a'] });

    expect(posts.create).toHaveBeenCalled();
    expect(versions.create).toHaveBeenCalledWith(expect.objectContaining({ postId: post.id }));
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'blog.post.created' }),
    );
  });
});
