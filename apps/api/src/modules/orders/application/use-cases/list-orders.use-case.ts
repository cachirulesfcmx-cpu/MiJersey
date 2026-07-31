import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type {
  OrderRepositoryPort,
  OrderSummaryView,
} from '../../domain/ports/order.repository.port';
import { ORDER_REPOSITORY } from '../../orders.constants';

@Injectable()
export class ListOrdersUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepositoryPort) {}

  async execute(
    customerId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<OrderSummaryView>> {
    return this.orders.findByCustomerId(customerId, params);
  }
}
