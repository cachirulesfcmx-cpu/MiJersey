import { Inject, Injectable } from '@nestjs/common';

import type { OrderStatusHistoryRepositoryPort } from '../../domain/ports/order-status-history.repository.port';
import type { OrderTimelineEvent } from '../../domain/value-objects/order-timeline-event';
import { ORDER_STATUS_HISTORY_REPOSITORY } from '../../orders.constants';
import { type GetOrderInput, GetOrderUseCase } from './get-order.use-case';

/** Construye la línea de tiempo (spec §2/§6 "Order Timeline"): el primer evento ("Confirmado") se deriva de `Order.createdAt`, no de una fila física — evita que Checkout (018) tenga que escribir en `OrderStatusHistory` al confirmar. Los eventos siguientes (cancelación, y en el futuro pago/envío) sí vienen de la tabla. */
@Injectable()
export class GetOrderTimelineUseCase {
  constructor(
    private readonly getOrder: GetOrderUseCase,
    @Inject(ORDER_STATUS_HISTORY_REPOSITORY)
    private readonly history: OrderStatusHistoryRepositoryPort,
  ) {}

  async execute(input: GetOrderInput): Promise<OrderTimelineEvent[]> {
    const order = await this.getOrder.execute(input);
    const json = order.toJSON();

    const events: OrderTimelineEvent[] = [
      { field: 'status', value: 'CONFIRMED', note: null, occurredAt: json.createdAt },
    ];

    const historyRows = await this.history.findByOrderId(order.id);
    for (const row of historyRows) {
      const entry = row.toJSON();
      events.push({
        field: entry.field,
        value: entry.value,
        note: entry.note,
        occurredAt: entry.createdAt,
      });
    }

    return events.sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  }
}
