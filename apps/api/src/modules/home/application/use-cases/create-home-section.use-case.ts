import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { HomeSectionEntity } from '../../domain/entities/home-section.entity';
import { InvalidHomeSectionConfigError } from '../../domain/errors/home.errors';
import type { HomeSectionRepositoryPort } from '../../domain/ports/home-section.repository.port';
import type { HomeSectionConfiguration } from '../../domain/value-objects/home-section-config';
import { validateHomeSectionConfig } from '../../domain/value-objects/home-section-config';
import {
  HomeSectionStatus,
  type HomeSectionType,
} from '../../domain/value-objects/home-section-enums';
import { HOME_SECTION_REPOSITORY } from '../../home.constants';
import { HomeMediaUsageService } from '../services/home-media-usage.service';

export interface CreateHomeSectionInput {
  type: HomeSectionType;
  title: string;
  configuration: HomeSectionConfiguration;
  status?: HomeSectionStatus;
  isVisible?: boolean;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateHomeSectionUseCase {
  constructor(
    @Inject(HOME_SECTION_REPOSITORY) private readonly sections: HomeSectionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly mediaUsage: HomeMediaUsageService,
  ) {}

  async execute(input: CreateHomeSectionInput): Promise<HomeSectionEntity> {
    const configError = validateHomeSectionConfig(input.type, input.configuration);
    if (configError) {
      throw new InvalidHomeSectionConfigError(configError);
    }

    const sortOrder = (await this.sections.maxSortOrder()) + 1;
    const section = await this.sections.create({
      type: input.type,
      title: input.title,
      configuration: input.configuration,
      sortOrder,
      status: input.status ?? HomeSectionStatus.DRAFT,
      isVisible: input.isVisible ?? true,
    });

    await this.mediaUsage.applyOnCreate(section.id, section.type, section.configuration);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'home.section.created',
      ipAddress: input.ipAddress,
      metadata: { sectionId: section.id, type: section.type },
    });

    return section;
  }
}
