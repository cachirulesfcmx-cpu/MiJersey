import { Inject, Injectable } from '@nestjs/common';

import type { OrderEntity } from '../../domain/entities/order.entity';
import { OrderNotFoundError } from '../../domain/errors/orders.errors';
import type { OrderRepositoryPort } from '../../domain/ports/order.repository.port';
import { ORDER_REPOSITORY } from '../../orders.constants';

export interface GetOrderInput {
  id: string;
  customerId: string;
}

/** 404 (no 403) cuando el pedido es de otro cliente — no revela que el recurso existe (spec §9 "autorización por propietario"), mismo criterio del resto de la sesión. */
@Injectable()
export class GetOrderUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepositoryPort) {}

  async execute(input: GetOrderInput): Promise<OrderEntity> {
    const order = await this.orders.findById(input.id);
    if (!order || order.customerId !== input.customerId) {
      throw new OrderNotFoundError();
    }
    return order;
  }
}
