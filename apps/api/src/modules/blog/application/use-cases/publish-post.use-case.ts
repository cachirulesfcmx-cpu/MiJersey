import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { POST_REPOSITORY, POST_VERSION_REPOSITORY } from '../../blog.constants';
import type { PostEntity } from '../../domain/entities/post.entity';
import { PostNotFoundError } from '../../domain/errors/blog.errors';
import type { PostRepositoryPort } from '../../domain/ports/post.repository.port';
import type { PostVersionRepositoryPort } from '../../domain/ports/post-version.repository.port';
import { PostStatus } from '../../domain/value-objects/post-enums';
import { toPostSnapshot } from '../../domain/value-objects/post-snapshot.util';
import { BlogCacheService } from '../services/blog-cache.service';

export interface PublishPostInput {
  id: string;
  /** Fecha futura -> publicación programada (`SCHEDULED`); ausente o pasada -> publicación inmediata. */
  publishAt?: Date;
  actorUserId: string;
  ipAddress: string | null;
}

/** Spec §2/§4 "Permitir programación de publicaciones": sin job en segundo plano, `SCHEDULED` se promueve a `PUBLISHED` al leerse — mismo criterio que CMS Pages (026). */
@Injectable()
export class PublishPostUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: PostRepositoryPort,
    @Inject(POST_VERSION_REPOSITORY) private readonly versions: PostVersionRepositoryPort,
    private readonly cache: BlogCacheService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: PublishPostInput): Promise<PostEntity> {
    const existing = await this.posts.findById(input.id);
    if (!existing) throw new PostNotFoundError();

    const now = new Date();
    const isScheduled = input.publishAt !== undefined && input.publishAt.getTime() > now.getTime();
    const status = isScheduled ? PostStatus.SCHEDULED : PostStatus.PUBLISHED;
    const publishedAt = isScheduled ? (input.publishAt as Date) : now;

    const updated = await this.posts.updateStatus(input.id, status, publishedAt);
    await this.versions.create({ postId: updated.id, snapshot: toPostSnapshot(updated) });
    await this.cache.invalidatePost(updated.slug);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'blog.post.published',
      ipAddress: input.ipAddress,
      metadata: { postId: updated.id, slug: updated.slug, status },
    });

    return updated;
  }
}
