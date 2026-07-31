import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { RmaRequestEntity } from '../../domain/entities/rma-request.entity';
import { RmaNotFoundError } from '../../domain/errors/support.errors';
import type { RmaRequestRepositoryPort } from '../../domain/ports/rma-request.repository.port';
import type { RmaStatus } from '../../domain/value-objects/support-enums';
import { RMA_REPOSITORY } from '../../support.constants';

export interface UpdateRmaStatusInput {
  id: string;
  status: RmaStatus;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateRmaStatusUseCase {
  constructor(
    @Inject(RMA_REPOSITORY) private readonly rmaRequests: RmaRequestRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateRmaStatusInput): Promise<RmaRequestEntity> {
    const existing = await this.rmaRequests.findById(input.id);
    if (!existing) throw new RmaNotFoundError();

    const updated = await this.rmaRequests.updateStatus(input.id, input.status);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'support.rma.status_changed',
      ipAddress: input.ipAddress,
      metadata: { rmaId: input.id, from: existing.status, to: input.status },
    });

    return updated;
  }
}
