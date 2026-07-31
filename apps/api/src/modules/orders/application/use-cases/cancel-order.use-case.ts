import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { OrderEntity } from '../../domain/entities/order.entity';
import { OrderNotCancellableError, OrderNotFoundError } from '../../domain/errors/orders.errors';
import type { OrderRepositoryPort } from '../../domain/ports/order.repository.port';
import type { OrderStatusHistoryRepositoryPort } from '../../domain/ports/order-status-history.repository.port';
import { canCancelOrder } from '../../domain/value-objects/order-transitions.util';
import { ORDER_REPOSITORY, ORDER_STATUS_HISTORY_REPOSITORY } from '../../orders.constants';

export interface CancelOrderInput {
  id: string;
  customerId: string;
  reason?: string;
}

/** Spec §2 "Cancelaciones" + §9 "validación de estados". No dispara ningún reembolso — la spec lo marca explícitamente "preparado para integración" (022-Payments no existe todavía); si el pedido ya estaba pagado, la cancelación deja constancia en la línea de tiempo pero el reembolso real queda pendiente de proceso manual/futuro. */
@Injectable()
export class CancelOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepositoryPort,
    @Inject(ORDER_STATUS_HISTORY_REPOSITORY)
    private readonly history: OrderStatusHistoryRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CancelOrderInput): Promise<OrderEntity> {
    const order = await this.orders.findById(input.id);
    if (!order || order.customerId !== input.customerId) {
      throw new OrderNotFoundError();
    }
    if (!canCancelOrder(order)) {
      throw new OrderNotCancellableError();
    }

    const reason = input.reason ?? null;
    const cancelled = await this.orders.cancel(input.id, reason);

    await this.history.create({
      orderId: input.id,
      field: 'status',
      value: 'CANCELLED',
      note: reason,
    });

    await this.auditLog.record({
      userId: input.customerId,
      action: 'order.cancelled',
      ipAddress: null,
      metadata: { orderId: input.id, reason },
    });

    return cancelled;
  }
}
