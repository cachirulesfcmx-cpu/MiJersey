import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { OrderEntity } from '../../domain/entities/order.entity';
import { OrderNotFoundError } from '../../domain/errors/orders.errors';
import type { OrderRepositoryPort } from '../../domain/ports/order.repository.port';
import type { OrderStatusHistoryRepositoryPort } from '../../domain/ports/order-status-history.repository.port';
import { ORDER_REPOSITORY, ORDER_STATUS_HISTORY_REPOSITORY } from '../../orders.constants';

export interface UpdateOrderStatusInput {
  orderId: string;
  field: 'paymentStatus' | 'fulfillmentStatus';
  value: string;
  note?: string;
  actorUserId?: string | null;
}

/**
 * Mecanismo genérico reservado para 022-Payments/023-Shipping: cuando esos módulos existan,
 * podrán importar `OrdersModule` y reutilizar este caso de uso para reflejar aquí sus propios
 * cambios de estado (pago capturado, envío despachado) sin que Orders tenga que cambiar ni
 * depender de ellos — mismo espíritu que el resto de la sesión (Cart exporta sus casos de uso
 * para que Checkout/Wishlist los reutilicen). Sin consumidores todavía dentro de 021.
 */
@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepositoryPort,
    @Inject(ORDER_STATUS_HISTORY_REPOSITORY)
    private readonly history: OrderStatusHistoryRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateOrderStatusInput): Promise<OrderEntity> {
    const existing = await this.orders.findById(input.orderId);
    if (!existing) throw new OrderNotFoundError();

    const updated = await this.orders.updateField(input.orderId, input.field, input.value);

    await this.history.create({
      orderId: input.orderId,
      field: input.field,
      value: input.value,
      note: input.note ?? null,
    });

    await this.auditLog.record({
      userId: input.actorUserId ?? null,
      action: 'order.status_changed',
      ipAddress: null,
      metadata: { orderId: input.orderId, field: input.field, value: input.value },
    });

    return updated;
  }
}
