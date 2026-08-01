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
import { PostNotFoundError, PostSlugAlreadyExistsError } from '../../domain/errors/blog.errors';
import type { BlogCategoryRepositoryPort } from '../../domain/ports/blog-category.repository.port';
import type { BlogTagRepositoryPort } from '../../domain/ports/blog-tag.repository.port';
import type { PostRepositoryPort, UpdatePostData } from '../../domain/ports/post.repository.port';
import type { PostVersionRepositoryPort } from '../../domain/ports/post-version.repository.port';
import { PostStatus } from '../../domain/value-objects/post-enums';
import { toPostSnapshot } from '../../domain/value-objects/post-snapshot.util';
import { assertTermsExist } from '../services/assert-terms-exist';
import { BlogCacheService } from '../services/blog-cache.service';

export interface UpdatePostInput extends UpdatePostData {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

/** Cada actualización crea una nueva versión y, si el artículo ya estaba publicado, invalida su caché pública — mismo criterio que `UpdatePageUseCase` (026). */
@Injectable()
export class UpdatePostUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: PostRepositoryPort,
    @Inject(POST_VERSION_REPOSITORY) private readonly versions: PostVersionRepositoryPort,
    @Inject(BLOG_CATEGORY_REPOSITORY) private readonly categories: BlogCategoryRepositoryPort,
    @Inject(BLOG_TAG_REPOSITORY) private readonly tags: BlogTagRepositoryPort,
    private readonly cache: BlogCacheService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdatePostInput): Promise<PostEntity> {
    const existing = await this.posts.findById(input.id);
    if (!existing) throw new PostNotFoundError();

    if (input.slug && input.slug !== existing.slug) {
      const conflict = await this.posts.findBySlug(input.slug);
      if (conflict) throw new PostSlugAlreadyExistsError();
    }

    await assertTermsExist(this.categories, this.tags, input.categoryIds ?? [], input.tagIds ?? []);

    const { id, actorUserId, ipAddress, ...data } = input;
    const updated = await this.posts.update(id, data);

    await this.versions.create({ postId: updated.id, snapshot: toPostSnapshot(updated) });

    if (existing.status === PostStatus.PUBLISHED) {
      await this.cache.invalidatePost(existing.slug);
      if (updated.slug !== existing.slug) await this.cache.invalidatePost(updated.slug);
    }

    await this.auditLog.record({
      userId: actorUserId,
      action: 'blog.post.updated',
      ipAddress,
      metadata: { postId: updated.id, slug: updated.slug },
    });

    return updated;
  }
}
