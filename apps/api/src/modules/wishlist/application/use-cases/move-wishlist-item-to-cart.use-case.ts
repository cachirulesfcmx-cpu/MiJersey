import { Inject, Injectable } from '@nestjs/common';

import { AddCartItemUseCase } from '../../../cart/application/use-cases/add-cart-item.use-case';
import { GetOrCreateCartUseCase } from '../../../cart/application/use-cases/get-or-create-cart.use-case';
import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { WishlistItemNotFoundError } from '../../domain/errors/wishlist.errors';
import type { WishlistItemRepositoryPort } from '../../domain/ports/wishlist-item.repository.port';
import { WISHLIST_ITEM_REPOSITORY } from '../../wishlist.constants';

export interface MoveWishlistItemToCartInput {
  wishlistId: string;
  itemId: string;
  customerId: string;
  sessionId: string;
}

/** "Mover productos al carrito" (spec §2/§6) reutiliza la lógica de negocio de Cart (017) tal cual —`GetOrCreateCartUseCase` + `AddCartItemUseCase` ya validan disponibilidad-para-venta y stock, no hay razón para duplicar esa validación aquí. Tras agregarlo al carrito, el item se quita de la wishlist — es un "mover", no un "copiar". */
@Injectable()
export class MoveWishlistItemToCartUseCase {
  constructor(
    @Inject(WISHLIST_ITEM_REPOSITORY) private readonly items: WishlistItemRepositoryPort,
    private readonly getOrCreateCart: GetOrCreateCartUseCase,
    private readonly addCartItem: AddCartItemUseCase,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: MoveWishlistItemToCartInput): Promise<void> {
    const existing = await this.items.findById(input.itemId);
    if (!existing || existing.wishlistId !== input.wishlistId) {
      throw new WishlistItemNotFoundError();
    }

    const cart = await this.getOrCreateCart.execute({
      sessionId: input.sessionId,
      customerId: input.customerId,
    });
    await this.addCartItem.execute({ cartId: cart.id, variantId: existing.variantId, quantity: 1 });
    await this.items.delete(input.itemId);

    await this.auditLog.record({
      userId: input.customerId,
      action: 'wishlist.item_moved_to_cart',
      ipAddress: null,
      metadata: {
        wishlistId: input.wishlistId,
        itemId: input.itemId,
        variantId: existing.variantId,
      },
    });
  }
}
