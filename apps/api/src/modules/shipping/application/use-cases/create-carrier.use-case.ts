import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { CarrierEntity } from '../../domain/entities/carrier.entity';
import { CarrierCodeAlreadyExistsError } from '../../domain/errors/shipping.errors';
import type {
  CarrierRepositoryPort,
  CreateCarrierData,
} from '../../domain/ports/carrier.repository.port';
import { CARRIER_REPOSITORY } from '../../shipping.constants';

export interface CreateCarrierInput extends CreateCarrierData {
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateCarrierUseCase {
  constructor(
    @Inject(CARRIER_REPOSITORY) private readonly carriers: CarrierRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateCarrierInput): Promise<CarrierEntity> {
    const existing = await this.carriers.findByCode(input.code);
    if (existing) throw new CarrierCodeAlreadyExistsError();

    const created = await this.carriers.create({
      name: input.name,
      code: input.code,
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'shipping.carrier.created',
      ipAddress: input.ipAddress,
      metadata: { carrierId: created.id, code: input.code },
    });

    return created;
  }
}
