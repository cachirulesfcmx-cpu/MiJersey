import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { CarrierEntity } from '../../domain/entities/carrier.entity';
import { CarrierNotFoundError } from '../../domain/errors/shipping.errors';
import type {
  CarrierRepositoryPort,
  UpdateCarrierData,
} from '../../domain/ports/carrier.repository.port';
import { CARRIER_REPOSITORY } from '../../shipping.constants';

export interface UpdateCarrierInput extends UpdateCarrierData {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateCarrierUseCase {
  constructor(
    @Inject(CARRIER_REPOSITORY) private readonly carriers: CarrierRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateCarrierInput): Promise<CarrierEntity> {
    const existing = await this.carriers.findById(input.id);
    if (!existing) throw new CarrierNotFoundError();

    const { id, actorUserId, ipAddress, ...data } = input;
    const updated = await this.carriers.update(id, data);

    await this.auditLog.record({
      userId: actorUserId,
      action: 'shipping.carrier.updated',
      ipAddress,
      metadata: { carrierId: id },
    });

    return updated;
  }
}
