import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { HomeSectionRepositoryPort } from '../../domain/ports/home-section.repository.port';
import { HOME_SECTION_REPOSITORY } from '../../home.constants';

export interface ReorderHomeSectionsInput {
  order: string[];
  actorUserId: string;
  ipAddress: string | null;
}

/** Reordenamiento por lote — spec §7 "reordenar (drag & drop)": el admin envía la lista completa de ids en el nuevo orden. */
@Injectable()
export class ReorderHomeSectionsUseCase {
  constructor(
    @Inject(HOME_SECTION_REPOSITORY) private readonly sections: HomeSectionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: ReorderHomeSectionsInput): Promise<void> {
    await this.sections.reorder(input.order);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'home.section.reordered',
      ipAddress: input.ipAddress,
      metadata: { order: input.order },
    });
  }
}
