import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { BRAND_REPOSITORY } from '../../brands.constants';
import type { BrandRepositoryPort } from '../../domain/ports/brand.repository.port';

export interface ReorderBrandsInput {
  orderedIds: string[];
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class ReorderBrandsUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: ReorderBrandsInput): Promise<void> {
    await this.brands.reorder(input.orderedIds);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'brand.reordered',
      ipAddress: input.ipAddress,
      metadata: { orderedIds: input.orderedIds },
    });
  }
}
