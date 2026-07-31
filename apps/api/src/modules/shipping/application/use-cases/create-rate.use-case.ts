import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { ShippingRateEntity } from '../../domain/entities/shipping-rate.entity';
import {
  CarrierNotFoundError,
  ShippingZoneNotFoundError,
} from '../../domain/errors/shipping.errors';
import type { CarrierRepositoryPort } from '../../domain/ports/carrier.repository.port';
import type {
  CreateRateData,
  ShippingRateRepositoryPort,
} from '../../domain/ports/shipping-rate.repository.port';
import type { ShippingZoneRepositoryPort } from '../../domain/ports/shipping-zone.repository.port';
import {
  CARRIER_REPOSITORY,
  SHIPPING_RATE_REPOSITORY,
  SHIPPING_ZONE_REPOSITORY,
} from '../../shipping.constants';

export interface CreateRateInput extends CreateRateData {
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateRateUseCase {
  constructor(
    @Inject(SHIPPING_RATE_REPOSITORY) private readonly rates: ShippingRateRepositoryPort,
    @Inject(CARRIER_REPOSITORY) private readonly carriers: CarrierRepositoryPort,
    @Inject(SHIPPING_ZONE_REPOSITORY) private readonly zones: ShippingZoneRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateRateInput): Promise<ShippingRateEntity> {
    const carrier = await this.carriers.findById(input.carrierId);
    if (!carrier) throw new CarrierNotFoundError();

    const zone = await this.zones.findById(input.zoneId);
    if (!zone) throw new ShippingZoneNotFoundError();

    const { actorUserId, ipAddress, ...data } = input;
    const created = await this.rates.create(data);

    await this.auditLog.record({
      userId: actorUserId,
      action: 'shipping.rate.created',
      ipAddress,
      metadata: { rateId: created.id, carrierId: input.carrierId, zoneId: input.zoneId },
    });

    return created;
  }
}
