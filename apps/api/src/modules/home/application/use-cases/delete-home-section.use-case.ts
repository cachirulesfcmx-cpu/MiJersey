import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { HomeSectionNotFoundError } from '../../domain/errors/home.errors';
import type { HomeSectionRepositoryPort } from '../../domain/ports/home-section.repository.port';
import { HOME_SECTION_REPOSITORY } from '../../home.constants';
import { HomeMediaUsageService } from '../services/home-media-usage.service';

export interface DeleteHomeSectionInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteHomeSectionUseCase {
  constructor(
    @Inject(HOME_SECTION_REPOSITORY) private readonly sections: HomeSectionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly mediaUsage: HomeMediaUsageService,
  ) {}

  async execute(input: DeleteHomeSectionInput): Promise<void> {
    const existing = await this.sections.findById(input.id);
    if (!existing) {
      throw new HomeSectionNotFoundError();
    }

    await this.mediaUsage.releaseAll(existing.id, existing.type, existing.configuration);
    await this.sections.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'home.section.deleted',
      ipAddress: input.ipAddress,
      metadata: { sectionId: input.id, type: existing.type },
    });
  }
}
