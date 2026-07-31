import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { ShippingZoneEntity } from '../../domain/entities/shipping-zone.entity';
import { ShippingZoneNotFoundError } from '../../domain/errors/shipping.errors';
import type {
  ShippingZoneRepositoryPort,
  UpdateZoneData,
} from '../../domain/ports/shipping-zone.repository.port';
import { SHIPPING_ZONE_REPOSITORY } from '../../shipping.constants';

export interface UpdateZoneInput extends UpdateZoneData {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateZoneUseCase {
  constructor(
    @Inject(SHIPPING_ZONE_REPOSITORY) private readonly zones: ShippingZoneRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateZoneInput): Promise<ShippingZoneEntity> {
    const existing = await this.zones.findById(input.id);
    if (!existing) throw new ShippingZoneNotFoundError();

    const { id, actorUserId, ipAddress, ...data } = input;
    const updated = await this.zones.update(id, data);

    await this.auditLog.record({
      userId: actorUserId,
      action: 'shipping.zone.updated',
      ipAddress,
      metadata: { zoneId: id },
    });

    return updated;
  }
}
