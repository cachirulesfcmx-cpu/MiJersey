import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PAGE_REPOSITORY, PAGE_VERSION_REPOSITORY } from '../../cms.constants';
import type { PageEntity } from '../../domain/entities/page.entity';
import { InvalidPageBlockError, PageSlugAlreadyExistsError } from '../../domain/errors/cms.errors';
import type {
  CreatePageData,
  PageBlockInput,
  PageRepositoryPort,
} from '../../domain/ports/page.repository.port';
import type { PageVersionRepositoryPort } from '../../domain/ports/page-version.repository.port';
import { validatePageBlockConfig } from '../../domain/value-objects/page-block-config';
import { toPageSnapshot } from '../../domain/value-objects/page-snapshot.util';

export interface CreatePageInput extends CreatePageData {
  actorUserId: string;
  ipAddress: string | null;
}

function assertValidBlocks(blocks: PageBlockInput[]): void {
  for (const block of blocks) {
    const error = validatePageBlockConfig(block.type, block.config);
    if (error) throw new InvalidPageBlockError(error);
  }
}

/** Cada creación deja la versión #1 en el historial (spec §4 "Mantener historial de versiones") — una página nunca existe sin al menos una versión que la respalde. */
@Injectable()
export class CreatePageUseCase {
  constructor(
    @Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort,
    @Inject(PAGE_VERSION_REPOSITORY) private readonly versions: PageVersionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreatePageInput): Promise<PageEntity> {
    const existing = await this.pages.findBySlug(input.slug);
    if (existing) throw new PageSlugAlreadyExistsError();

    assertValidBlocks(input.blocks);

    const { actorUserId, ipAddress, ...data } = input;
    const page = await this.pages.create(data);

    await this.versions.create({ pageId: page.id, snapshot: toPageSnapshot(page) });

    await this.auditLog.record({
      userId: actorUserId,
      action: 'cms.page.created',
      ipAddress,
      metadata: { pageId: page.id, slug: page.slug },
    });

    return page;
  }
}
