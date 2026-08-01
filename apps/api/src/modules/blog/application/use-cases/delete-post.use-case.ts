import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { POST_REPOSITORY } from '../../blog.constants';
import { PostNotFoundError } from '../../domain/errors/blog.errors';
import type { PostRepositoryPort } from '../../domain/ports/post.repository.port';
import { BlogCacheService } from '../services/blog-cache.service';

export interface DeletePostInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeletePostUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: PostRepositoryPort,
    private readonly cache: BlogCacheService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeletePostInput): Promise<void> {
    const existing = await this.posts.findById(input.id);
    if (!existing) throw new PostNotFoundError();

    await this.posts.delete(input.id);
    await this.cache.invalidatePost(existing.slug);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'blog.post.deleted',
      ipAddress: input.ipAddress,
      metadata: { postId: input.id, slug: existing.slug },
    });
  }
}
