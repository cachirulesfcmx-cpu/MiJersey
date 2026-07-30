import { Inject, Injectable } from '@nestjs/common';

import { SHIPPING_METHOD_REPOSITORY } from '../../checkout.constants';
import type { ShippingMethodEntity } from '../../domain/entities/shipping-method.entity';
import type { ShippingMethodRepositoryPort } from '../../domain/ports/shipping-method.repository.port';

export interface ListShippingMethodsInput {
  onlyActive?: boolean;
}

@Injectable()
export class ListShippingMethodsUseCase {
  constructor(
    @Inject(SHIPPING_METHOD_REPOSITORY)
    private readonly shippingMethods: ShippingMethodRepositoryPort,
  ) {}

  async execute(input: ListShippingMethodsInput = {}): Promise<ShippingMethodEntity[]> {
    return input.onlyActive ? this.shippingMethods.findActive() : this.shippingMethods.findMany();
  }
}
