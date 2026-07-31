import { Inject, Injectable } from '@nestjs/common';

import { AddCartItemUseCase } from '../../../cart/application/use-cases/add-cart-item.use-case';
import { GetOrCreateCartUseCase } from '../../../cart/application/use-cases/get-or-create-cart.use-case';
import type { CartEntity } from '../../../cart/domain/entities/cart.entity';
import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { type GetOrderInput, GetOrderUseCase } from './get-order.use-case';

export interface ReorderInput extends GetOrderInput {
  sessionId: string;
}

export interface ReorderResult {
  cart: CartEntity;
  succeededCount: number;
  failedCount: number;
}

/**
 * Implementación formal de "Reorder Button" (spec §6) + `POST /orders/:id/reorder` (spec §7),
 * reemplazando la orquestación de frontend construida en 019-Customer-Account (que llamaba
 * `useCart().addItem()` por cada línea desde el navegador porque este endpoint todavía no existía).
 * Reutiliza `GetOrCreateCartUseCase`/`AddCartItemUseCase` de Cart (017) tal cual — no reimplementa
 * validación de disponibilidad/stock. Los artículos que ya no se pueden agregar (variante
 * descontinuada, sin stock) se omiten sin abortar el resto, mismo comportamiento que la versión
 * de frontend que reemplaza.
 */
@Injectable()
export class ReorderUseCase {
  constructor(
    private readonly getOrder: GetOrderUseCase,
    private readonly getOrCreateCart: GetOrCreateCartUseCase,
    private readonly addCartItem: AddCartItemUseCase,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: ReorderInput): Promise<ReorderResult> {
    const order = await this.getOrder.execute(input);

    let cart = await this.getOrCreateCart.execute({
      sessionId: input.sessionId,
      customerId: input.customerId,
    });

    let succeededCount = 0;
    let failedCount = 0;

    for (const item of order.items) {
      try {
        cart = await this.addCartItem.execute({
          cartId: cart.id,
          variantId: item.variantId,
          quantity: item.quantity,
        });
        succeededCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    await this.auditLog.record({
      userId: input.customerId,
      action: 'order.reordered',
      ipAddress: null,
      metadata: { orderId: input.id, succeededCount, failedCount },
    });

    return { cart, succeededCount, failedCount };
  }
}
