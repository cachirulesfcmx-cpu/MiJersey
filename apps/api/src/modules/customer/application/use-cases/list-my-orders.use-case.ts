import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import { CUSTOMER_ORDER_LOOKUP } from '../../customer.constants';
import type {
  CustomerOrderLookupPort,
  CustomerOrderSummaryView,
} from '../../domain/ports/customer-order-lookup.port';

@Injectable()
export class ListMyOrdersUseCase {
  constructor(@Inject(CUSTOMER_ORDER_LOOKUP) private readonly orders: CustomerOrderLookupPort) {}

  async execute(
    customerId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<CustomerOrderSummaryView>> {
    return this.orders.findByCustomerId(customerId, params);
  }
}
