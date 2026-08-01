import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PAGE_REPOSITORY, PAGE_VERSION_REPOSITORY } from '../../cms.constants';
import type { PageEntity } from '../../domain/entities/page.entity';
import { PageNotFoundError } from '../../domain/errors/cms.errors';
import type { PageRepositoryPort } from '../../domain/ports/page.repository.port';
import type { PageVersionRepositoryPort } from '../../domain/ports/page-version.repository.port';
import { PageStatus } from '../../domain/value-objects/page-enums';
import { toPageSnapshot } from '../../domain/value-objects/page-snapshot.util';
import { CmsCacheService } from '../services/cms-cache.service';

export interface PublishPageInput {
  id: string;
  /** Fecha futura -> publicación programada (`SCHEDULED`); ausente o pasada -> publicación inmediata. */
  publishAt?: Date;
  actorUserId: string;
  ipAddress: string | null;
}

/** Spec §2/§4 "Publicación programada": sin un job en segundo plano, `SCHEDULED` se promueve a `PUBLISHED` al leerse (`GetPublishedPageUseCase`), mismo criterio que el motor de SLA de Support (025). */
@Injectable()
export class PublishPageUseCase {
  constructor(
    @Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort,
    @Inject(PAGE_VERSION_REPOSITORY) private readonly versions: PageVersionRepositoryPort,
    private readonly cache: CmsCacheService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: PublishPageInput): Promise<PageEntity> {
    const existing = await this.pages.findById(input.id);
    if (!existing) throw new PageNotFoundError();

    const now = new Date();
    const isScheduled = input.publishAt !== undefined && input.publishAt.getTime() > now.getTime();
    const status = isScheduled ? PageStatus.SCHEDULED : PageStatus.PUBLISHED;
    const publishedAt = isScheduled ? (input.publishAt as Date) : now;

    const updated = await this.pages.updateStatus(input.id, status, publishedAt);
    await this.versions.create({ pageId: updated.id, snapshot: toPageSnapshot(updated) });
    await this.cache.invalidatePage(updated.slug);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'cms.page.published',
      ipAddress: input.ipAddress,
      metadata: { pageId: updated.id, slug: updated.slug, status },
    });

    return updated;
  }
}
