import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { ShippingZoneNotFoundError } from '../../domain/errors/shipping.errors';
import type { ShippingZoneRepositoryPort } from '../../domain/ports/shipping-zone.repository.port';
import { SHIPPING_ZONE_REPOSITORY } from '../../shipping.constants';

export interface DeleteZoneInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteZoneUseCase {
  constructor(
    @Inject(SHIPPING_ZONE_REPOSITORY) private readonly zones: ShippingZoneRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteZoneInput): Promise<void> {
    const existing = await this.zones.findById(input.id);
    if (!existing) throw new ShippingZoneNotFoundError();

    await this.zones.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'shipping.zone.deleted',
      ipAddress: input.ipAddress,
      metadata: { zoneId: input.id },
    });
  }
}
