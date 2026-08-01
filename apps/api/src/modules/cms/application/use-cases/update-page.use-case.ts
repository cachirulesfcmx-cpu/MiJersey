import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PAGE_REPOSITORY, PAGE_VERSION_REPOSITORY } from '../../cms.constants';
import type { PageEntity } from '../../domain/entities/page.entity';
import {
  InvalidPageBlockError,
  PageNotFoundError,
  PageSlugAlreadyExistsError,
} from '../../domain/errors/cms.errors';
import type {
  PageBlockInput,
  PageRepositoryPort,
  UpdatePageData,
} from '../../domain/ports/page.repository.port';
import type { PageVersionRepositoryPort } from '../../domain/ports/page-version.repository.port';
import { validatePageBlockConfig } from '../../domain/value-objects/page-block-config';
import { PageStatus } from '../../domain/value-objects/page-enums';
import { toPageSnapshot } from '../../domain/value-objects/page-snapshot.util';
import { CmsCacheService } from '../services/cms-cache.service';

export interface UpdatePageInput extends UpdatePageData {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

function assertValidBlocks(blocks: PageBlockInput[]): void {
  for (const block of blocks) {
    const error = validatePageBlockConfig(block.type, block.config);
    if (error) throw new InvalidPageBlockError(error);
  }
}

/** Cada actualización crea una nueva versión (spec §4) y, si la página ya estaba publicada, invalida su caché pública — el contenido en vivo pudo haber cambiado. */
@Injectable()
export class UpdatePageUseCase {
  constructor(
    @Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort,
    @Inject(PAGE_VERSION_REPOSITORY) private readonly versions: PageVersionRepositoryPort,
    private readonly cache: CmsCacheService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdatePageInput): Promise<PageEntity> {
    const existing = await this.pages.findById(input.id);
    if (!existing) throw new PageNotFoundError();

    if (input.slug && input.slug !== existing.slug) {
      const conflict = await this.pages.findBySlug(input.slug);
      if (conflict) throw new PageSlugAlreadyExistsError();
    }

    if (input.blocks) assertValidBlocks(input.blocks);

    const { id, actorUserId, ipAddress, ...data } = input;
    const updated = await this.pages.update(id, data);

    await this.versions.create({ pageId: updated.id, snapshot: toPageSnapshot(updated) });

    if (existing.status === PageStatus.PUBLISHED) {
      await this.cache.invalidatePage(existing.slug);
      if (updated.slug !== existing.slug) await this.cache.invalidatePage(updated.slug);
    }

    await this.auditLog.record({
      userId: actorUserId,
      action: 'cms.page.updated',
      ipAddress,
      metadata: { pageId: updated.id, slug: updated.slug },
    });

    return updated;
  }
}
