import type { PaginatedResult } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type {
  ListAllOrdersParams,
  OrderRepositoryPort,
  OrderSummaryView,
} from '../../domain/ports/order.repository.port';
import { ORDER_REPOSITORY } from '../../orders.constants';

/** Para el Orders Dashboard de administración (spec §6) — sin filtro de propietario, requiere permiso `admin:access`. */
@Injectable()
export class ListAllOrdersUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepositoryPort) {}

  async execute(params: ListAllOrdersParams): Promise<PaginatedResult<OrderSummaryView>> {
    return this.orders.findAll(params);
  }
}
