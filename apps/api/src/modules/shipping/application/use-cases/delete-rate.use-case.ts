import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { ShippingRateNotFoundError } from '../../domain/errors/shipping.errors';
import type { ShippingRateRepositoryPort } from '../../domain/ports/shipping-rate.repository.port';
import { SHIPPING_RATE_REPOSITORY } from '../../shipping.constants';

export interface DeleteRateInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteRateUseCase {
  constructor(
    @Inject(SHIPPING_RATE_REPOSITORY) private readonly rates: ShippingRateRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteRateInput): Promise<void> {
    const existing = await this.rates.findById(input.id);
    if (!existing) throw new ShippingRateNotFoundError();

    await this.rates.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'shipping.rate.deleted',
      ipAddress: input.ipAddress,
      metadata: { rateId: input.id },
    });
  }
}
