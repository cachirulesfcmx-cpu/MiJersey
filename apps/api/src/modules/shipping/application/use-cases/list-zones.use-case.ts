import { Inject, Injectable } from '@nestjs/common';

import type { ShippingZoneEntity } from '../../domain/entities/shipping-zone.entity';
import type { ShippingZoneRepositoryPort } from '../../domain/ports/shipping-zone.repository.port';
import { SHIPPING_ZONE_REPOSITORY } from '../../shipping.constants';

@Injectable()
export class ListZonesUseCase {
  constructor(
    @Inject(SHIPPING_ZONE_REPOSITORY) private readonly zones: ShippingZoneRepositoryPort,
  ) {}

  async execute(): Promise<ShippingZoneEntity[]> {
    return this.zones.findMany();
  }
}
