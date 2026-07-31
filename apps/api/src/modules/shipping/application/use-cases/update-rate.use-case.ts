import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { ShippingRateEntity } from '../../domain/entities/shipping-rate.entity';
import { ShippingRateNotFoundError } from '../../domain/errors/shipping.errors';
import type {
  ShippingRateRepositoryPort,
  UpdateRateData,
} from '../../domain/ports/shipping-rate.repository.port';
import { SHIPPING_RATE_REPOSITORY } from '../../shipping.constants';

export interface UpdateRateInput extends UpdateRateData {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateRateUseCase {
  constructor(
    @Inject(SHIPPING_RATE_REPOSITORY) private readonly rates: ShippingRateRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateRateInput): Promise<ShippingRateEntity> {
    const existing = await this.rates.findById(input.id);
    if (!existing) throw new ShippingRateNotFoundError();

    const { id, actorUserId, ipAddress, ...data } = input;
    const updated = await this.rates.update(id, data);

    await this.auditLog.record({
      userId: actorUserId,
      action: 'shipping.rate.updated',
      ipAddress,
      metadata: { rateId: id },
    });

    return updated;
  }
}
