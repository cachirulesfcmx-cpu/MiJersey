import { Inject, Injectable } from '@nestjs/common';

import type { ShippingRateEntity } from '../../domain/entities/shipping-rate.entity';
import type { ShippingRateRepositoryPort } from '../../domain/ports/shipping-rate.repository.port';
import { SHIPPING_RATE_REPOSITORY } from '../../shipping.constants';

@Injectable()
export class ListRatesUseCase {
  constructor(
    @Inject(SHIPPING_RATE_REPOSITORY) private readonly rates: ShippingRateRepositoryPort,
  ) {}

  async execute(): Promise<ShippingRateEntity[]> {
    return this.rates.findMany();
  }
}
