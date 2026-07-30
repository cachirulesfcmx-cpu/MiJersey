import { Inject, Injectable } from '@nestjs/common';

import { CUSTOMER_ORDER_LOOKUP } from '../../customer.constants';
import { OrderNotFoundError } from '../../domain/errors/customer.errors';
import type {
  CustomerOrderDetailView,
  CustomerOrderLookupPort,
} from '../../domain/ports/customer-order-lookup.port';

export interface GetMyOrderInput {
  id: string;
  customerId: string;
}

@Injectable()
export class GetMyOrderUseCase {
  constructor(@Inject(CUSTOMER_ORDER_LOOKUP) private readonly orders: CustomerOrderLookupPort) {}

  async execute(input: GetMyOrderInput): Promise<CustomerOrderDetailView> {
    const order = await this.orders.findById(input.id);
    // Igual que con direcciones: un pedido ajeno se reporta como 404, no 403.
    if (!order || order.customerId !== input.customerId) {
      throw new OrderNotFoundError();
    }

    return order;
  }
}
