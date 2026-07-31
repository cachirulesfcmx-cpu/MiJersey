import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { ShippingZoneEntity } from '../../domain/entities/shipping-zone.entity';
import type {
  CreateZoneData,
  ShippingZoneRepositoryPort,
} from '../../domain/ports/shipping-zone.repository.port';
import { SHIPPING_ZONE_REPOSITORY } from '../../shipping.constants';

export interface CreateZoneInput extends CreateZoneData {
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateZoneUseCase {
  constructor(
    @Inject(SHIPPING_ZONE_REPOSITORY) private readonly zones: ShippingZoneRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateZoneInput): Promise<ShippingZoneEntity> {
    const created = await this.zones.create({
      name: input.name,
      countries: input.countries,
      ...(input.states !== undefined ? { states: input.states } : {}),
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'shipping.zone.created',
      ipAddress: input.ipAddress,
      metadata: { zoneId: created.id },
    });

    return created;
  }
}
