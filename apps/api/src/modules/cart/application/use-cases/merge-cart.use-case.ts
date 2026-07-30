import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import {
  CART_INVENTORY_AVAILABILITY,
  CART_ITEM_REPOSITORY,
  CART_REPOSITORY,
} from '../../cart.constants';
import type { CartEntity } from '../../domain/entities/cart.entity';
import type { CartRepositoryPort } from '../../domain/ports/cart.repository.port';
import type { CartInventoryAvailabilityPort } from '../../domain/ports/cart-inventory-availability.port';
import type { CartItemRepositoryPort } from '../../domain/ports/cart-item.repository.port';
import { CartStatus } from '../../domain/value-objects/cart-enums';
import { GetOrCreateCartUseCase } from './get-or-create-cart.use-case';

export interface MergeCartInput {
  sessionId: string;
  customerId: string;
}

/**
 * Fusión de carritos al iniciar sesión (spec §4). Casos:
 * - Sin carrito de invitado: nada que fusionar, se resuelve/crea el carrito del cliente normalmente.
 * - Invitado sin carrito propio de cliente: se "adopta" el carrito de invitado (sin fusión real).
 * - Ambos existen y son carritos distintos: las líneas del invitado se suman a las del cliente
 *   (mismo `variantId` → se suma cantidad, tope la disponibilidad vigente; variante nueva → se copia
 *   la línea), y el carrito de invitado queda `MERGED` (no se borra, por trazabilidad/auditoría).
 */
@Injectable()
export class MergeCartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepositoryPort,
    @Inject(CART_ITEM_REPOSITORY) private readonly items: CartItemRepositoryPort,
    @Inject(CART_INVENTORY_AVAILABILITY)
    private readonly availability: CartInventoryAvailabilityPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly getOrCreateCart: GetOrCreateCartUseCase,
  ) {}

  async execute(input: MergeCartInput): Promise<CartEntity> {
    const guestCart = await this.carts.findActiveBySessionId(input.sessionId);
    const customerCart = await this.carts.findActiveByCustomerId(input.customerId);

    if (!guestCart) {
      return customerCart ?? this.getOrCreateCart.execute(input);
    }

    if (guestCart.customerId === input.customerId) {
      return guestCart;
    }

    if (!customerCart) {
      return this.carts.attachCustomer(guestCart.id, input.customerId);
    }

    const guestItems = await this.items.findByCartId(guestCart.id);

    for (const guestItem of guestItems) {
      const existing = await this.items.findByCartAndVariant(customerCart.id, guestItem.variantId);
      const available = await this.availability.getAvailability(guestItem.variantId);
      const desiredQuantity = (existing?.quantity ?? 0) + guestItem.quantity;
      const quantity = Math.min(desiredQuantity, Math.max(available, 0));
      if (quantity <= 0) continue;

      const subtotal = guestItem.unitPrice * quantity;
      if (existing) {
        await this.items.update(existing.id, {
          quantity,
          unitPrice: guestItem.unitPrice,
          subtotal,
        });
      } else {
        await this.items.create({
          cartId: customerCart.id,
          productId: guestItem.productId,
          variantId: guestItem.variantId,
          sku: guestItem.sku,
          quantity,
          unitPrice: guestItem.unitPrice,
          subtotal,
        });
      }
      await this.items.delete(guestItem.id);
    }

    await this.carts.updateStatus(guestCart.id, CartStatus.MERGED);

    await this.auditLog.record({
      userId: input.customerId,
      action: 'cart.merged',
      ipAddress: null,
      metadata: { fromCartId: guestCart.id, toCartId: customerCart.id, sessionId: input.sessionId },
    });

    const merged = await this.carts.findById(customerCart.id);
    return merged ?? customerCart;
  }
}
