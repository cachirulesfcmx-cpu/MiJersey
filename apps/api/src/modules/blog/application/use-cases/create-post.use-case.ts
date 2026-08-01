import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import {
  BLOG_CATEGORY_REPOSITORY,
  BLOG_TAG_REPOSITORY,
  POST_REPOSITORY,
  POST_VERSION_REPOSITORY,
} from '../../blog.constants';
import type { PostEntity } from '../../domain/entities/post.entity';
import { PostSlugAlreadyExistsError } from '../../domain/errors/blog.errors';
import type { BlogCategoryRepositoryPort } from '../../domain/ports/blog-category.repository.port';
import type { BlogTagRepositoryPort } from '../../domain/ports/blog-tag.repository.port';
import type { CreatePostData, PostRepositoryPort } from '../../domain/ports/post.repository.port';
import type { PostVersionRepositoryPort } from '../../domain/ports/post-version.repository.port';
import { toPostSnapshot } from '../../domain/value-objects/post-snapshot.util';
import { assertTermsExist } from '../services/assert-terms-exist';

export interface CreatePostInput extends CreatePostData {
  actorUserId: string;
  ipAddress: string | null;
}

/** Cada creación deja la versión #1 en el historial (spec §4 "Mantener borradores y versiones") — mismo criterio que `CreatePageUseCase` (026). */
@Injectable()
export class CreatePostUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: PostRepositoryPort,
    @Inject(POST_VERSION_REPOSITORY) private readonly versions: PostVersionRepositoryPort,
    @Inject(BLOG_CATEGORY_REPOSITORY) private readonly categories: BlogCategoryRepositoryPort,
    @Inject(BLOG_TAG_REPOSITORY) private readonly tags: BlogTagRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreatePostInput): Promise<PostEntity> {
    const existing = await this.posts.findBySlug(input.slug);
    if (existing) throw new PostSlugAlreadyExistsError();

    await assertTermsExist(this.categories, this.tags, input.categoryIds, input.tagIds);

    const { actorUserId, ipAddress, ...data } = input;
    const post = await this.posts.create(data);

    await this.versions.create({ postId: post.id, snapshot: toPostSnapshot(post) });

    await this.auditLog.record({
      userId: actorUserId,
      action: 'blog.post.created',
      ipAddress,
      metadata: { postId: post.id, slug: post.slug },
    });

    return post;
  }
}
