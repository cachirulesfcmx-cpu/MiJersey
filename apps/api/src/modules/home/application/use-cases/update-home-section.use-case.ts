import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { HomeSectionEntity } from '../../domain/entities/home-section.entity';
import {
  HomeSectionNotFoundError,
  InvalidHomeSectionConfigError,
} from '../../domain/errors/home.errors';
import type { HomeSectionRepositoryPort } from '../../domain/ports/home-section.repository.port';
import type { HomeSectionConfiguration } from '../../domain/value-objects/home-section-config';
import { validateHomeSectionConfig } from '../../domain/value-objects/home-section-config';
import type { HomeSectionStatus } from '../../domain/value-objects/home-section-enums';
import { HOME_SECTION_REPOSITORY } from '../../home.constants';
import { HomeMediaUsageService } from '../services/home-media-usage.service';

export interface UpdateHomeSectionInput {
  id: string;
  title?: string;
  configuration?: HomeSectionConfiguration;
  status?: HomeSectionStatus;
  isVisible?: boolean;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateHomeSectionUseCase {
  constructor(
    @Inject(HOME_SECTION_REPOSITORY) private readonly sections: HomeSectionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly mediaUsage: HomeMediaUsageService,
  ) {}

  async execute(input: UpdateHomeSectionInput): Promise<HomeSectionEntity> {
    const existing = await this.sections.findById(input.id);
    if (!existing) {
      throw new HomeSectionNotFoundError();
    }

    if (input.configuration !== undefined) {
      const configError = validateHomeSectionConfig(existing.type, input.configuration);
      if (configError) {
        throw new InvalidHomeSectionConfigError(configError);
      }
    }

    const updated = await this.sections.update(input.id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.configuration !== undefined ? { configuration: input.configuration } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.isVisible !== undefined ? { isVisible: input.isVisible } : {}),
    });

    if (input.configuration !== undefined) {
      await this.mediaUsage.applyOnUpdate(
        existing.id,
        existing.type,
        existing.configuration,
        updated.configuration,
      );
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'home.section.updated',
      ipAddress: input.ipAddress,
      metadata: { sectionId: updated.id },
    });

    return updated;
  }
}
