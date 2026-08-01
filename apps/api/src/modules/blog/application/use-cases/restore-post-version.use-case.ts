import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { POST_REPOSITORY, POST_VERSION_REPOSITORY } from '../../blog.constants';
import type { PostEntity } from '../../domain/entities/post.entity';
import {
  PostNotFoundError,
  PostSlugAlreadyExistsError,
  PostVersionNotFoundError,
} from '../../domain/errors/blog.errors';
import type { PostRepositoryPort } from '../../domain/ports/post.repository.port';
import type { PostVersionRepositoryPort } from '../../domain/ports/post-version.repository.port';
import { PostStatus } from '../../domain/value-objects/post-enums';
import { toPostSnapshot } from '../../domain/value-objects/post-snapshot.util';
import { BlogCacheService } from '../services/blog-cache.service';

export interface RestorePostVersionInput {
  postId: string;
  versionNumber: number;
  actorUserId: string;
  ipAddress: string | null;
}

/** Restaurar no borra historial: aplica el snapshot elegido y guarda el resultado como una versión NUEVA, sin tocar el estado de publicación vigente — mismo criterio que `RestorePageVersionUseCase` (026). */
@Injectable()
export class RestorePostVersionUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: PostRepositoryPort,
    @Inject(POST_VERSION_REPOSITORY) private readonly versions: PostVersionRepositoryPort,
    private readonly cache: BlogCacheService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: RestorePostVersionInput): Promise<PostEntity> {
    const existing = await this.posts.findById(input.postId);
    if (!existing) throw new PostNotFoundError();

    const version = await this.versions.findByPostAndNumber(input.postId, input.versionNumber);
    if (!version) throw new PostVersionNotFoundError();

    const { snapshot } = version;
    if (snapshot.slug !== existing.slug) {
      const conflict = await this.posts.findBySlug(snapshot.slug);
      if (conflict) throw new PostSlugAlreadyExistsError();
    }

    const restored = await this.posts.update(input.postId, {
      title: snapshot.title,
      slug: snapshot.slug,
      excerpt: snapshot.excerpt,
      content: snapshot.content,
      featuredImage: snapshot.featuredImage,
      seoTitle: snapshot.seoTitle,
      seoDescription: snapshot.seoDescription,
      categoryIds: snapshot.categoryIds,
      tagIds: snapshot.tagIds,
    });

    await this.versions.create({ postId: restored.id, snapshot: toPostSnapshot(restored) });

    if (existing.status === PostStatus.PUBLISHED) {
      await this.cache.invalidatePost(existing.slug);
      if (restored.slug !== existing.slug) await this.cache.invalidatePost(restored.slug);
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'blog.post.version_restored',
      ipAddress: input.ipAddress,
      metadata: { postId: input.postId, restoredFrom: input.versionNumber },
    });

    return restored;
  }
}
