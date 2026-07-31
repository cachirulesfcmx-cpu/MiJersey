import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { CarrierNotFoundError } from '../../domain/errors/shipping.errors';
import type { CarrierRepositoryPort } from '../../domain/ports/carrier.repository.port';
import { CARRIER_REPOSITORY } from '../../shipping.constants';

export interface DeleteCarrierInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteCarrierUseCase {
  constructor(
    @Inject(CARRIER_REPOSITORY) private readonly carriers: CarrierRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteCarrierInput): Promise<void> {
    const existing = await this.carriers.findById(input.id);
    if (!existing) throw new CarrierNotFoundError();

    await this.carriers.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'shipping.carrier.deleted',
      ipAddress: input.ipAddress,
      metadata: { carrierId: input.id },
    });
  }
}
