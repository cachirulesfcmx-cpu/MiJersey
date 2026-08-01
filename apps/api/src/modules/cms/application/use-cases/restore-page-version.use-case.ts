import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PAGE_REPOSITORY, PAGE_VERSION_REPOSITORY } from '../../cms.constants';
import type { PageEntity } from '../../domain/entities/page.entity';
import {
  PageNotFoundError,
  PageSlugAlreadyExistsError,
  PageVersionNotFoundError,
} from '../../domain/errors/cms.errors';
import type { PageRepositoryPort } from '../../domain/ports/page.repository.port';
import type { PageVersionRepositoryPort } from '../../domain/ports/page-version.repository.port';
import { PageStatus } from '../../domain/value-objects/page-enums';
import { toPageSnapshot } from '../../domain/value-objects/page-snapshot.util';
import { CmsCacheService } from '../services/cms-cache.service';

export interface RestorePageVersionInput {
  pageId: string;
  versionNumber: number;
  actorUserId: string;
  ipAddress: string | null;
}

/** Restaurar no borra historial: aplica el snapshot de la versión elegida y guarda el resultado como una versión NUEVA (spec §10 "restauración de versiones" es un evento auditado, no un rebobinado destructivo). */
@Injectable()
export class RestorePageVersionUseCase {
  constructor(
    @Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort,
    @Inject(PAGE_VERSION_REPOSITORY) private readonly versions: PageVersionRepositoryPort,
    private readonly cache: CmsCacheService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: RestorePageVersionInput): Promise<PageEntity> {
    const existing = await this.pages.findById(input.pageId);
    if (!existing) throw new PageNotFoundError();

    const version = await this.versions.findByPageAndNumber(input.pageId, input.versionNumber);
    if (!version) throw new PageVersionNotFoundError();

    const { snapshot } = version;
    if (snapshot.slug !== existing.slug) {
      const conflict = await this.pages.findBySlug(snapshot.slug);
      if (conflict) throw new PageSlugAlreadyExistsError();
    }

    const restored = await this.pages.update(input.pageId, {
      title: snapshot.title,
      slug: snapshot.slug,
      template: snapshot.template,
      seoTitle: snapshot.seoTitle,
      seoDescription: snapshot.seoDescription,
      blocks: snapshot.blocks,
    });

    await this.versions.create({ pageId: restored.id, snapshot: toPageSnapshot(restored) });

    if (existing.status === PageStatus.PUBLISHED) {
      await this.cache.invalidatePage(existing.slug);
      if (restored.slug !== existing.slug) await this.cache.invalidatePage(restored.slug);
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'cms.page.version_restored',
      ipAddress: input.ipAddress,
      metadata: { pageId: input.pageId, restoredFrom: input.versionNumber },
    });

    return restored;
  }
}
