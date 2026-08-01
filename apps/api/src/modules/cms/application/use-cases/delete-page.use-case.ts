import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PAGE_REPOSITORY } from '../../cms.constants';
import { PageNotFoundError } from '../../domain/errors/cms.errors';
import type { PageRepositoryPort } from '../../domain/ports/page.repository.port';
import { CmsCacheService } from '../services/cms-cache.service';

export interface DeletePageInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeletePageUseCase {
  constructor(
    @Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort,
    private readonly cache: CmsCacheService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeletePageInput): Promise<void> {
    const existing = await this.pages.findById(input.id);
    if (!existing) throw new PageNotFoundError();

    await this.pages.delete(input.id);
    await this.cache.invalidatePage(existing.slug);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'cms.page.deleted',
      ipAddress: input.ipAddress,
      metadata: { pageId: input.id, slug: existing.slug },
    });
  }
}
