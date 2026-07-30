import { Inject, Injectable } from '@nestjs/common';

import {
  CART_INVENTORY_AVAILABILITY,
  CART_ITEM_REPOSITORY,
  CART_PRODUCT_LOOKUP,
  CART_REPOSITORY,
} from '../../cart.constants';
import type { CartEntity } from '../../domain/entities/cart.entity';
import {
  CartNotFoundError,
  InsufficientInventoryError,
  ProductNotAvailableError,
} from '../../domain/errors/cart.errors';
import type { CartRepositoryPort } from '../../domain/ports/cart.repository.port';
import type { CartInventoryAvailabilityPort } from '../../domain/ports/cart-inventory-availability.port';
import type { CartItemRepositoryPort } from '../../domain/ports/cart-item.repository.port';
import type { CartProductLookupPort } from '../../domain/ports/cart-product-lookup.port';

export interface AddCartItemInput {
  cartId: string;
  variantId: string;
  quantity: number;
}

/** Si la variante ya está en el carrito, suma cantidades en vez de duplicar la línea (spec §4 "cantidades"). `unitPrice` siempre se refresca al precio vigente de la variante — tanto al agregar por primera vez como al sumar más unidades. */
@Injectable()
export class AddCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepositoryPort,
    @Inject(CART_ITEM_REPOSITORY) private readonly items: CartItemRepositoryPort,
    @Inject(CART_PRODUCT_LOOKUP) private readonly productLookup: CartProductLookupPort,
    @Inject(CART_INVENTORY_AVAILABILITY)
    private readonly availability: CartInventoryAvailabilityPort,
  ) {}

  async execute(input: AddCartItemInput): Promise<CartEntity> {
    const cart = await this.carts.findById(input.cartId);
    if (!cart) throw new CartNotFoundError();

    const variantInfo = await this.productLookup.findVariantInfo(input.variantId);
    if (!variantInfo || !variantInfo.isAvailableForSale) {
      throw new ProductNotAvailableError();
    }

    const existing = await this.items.findByCartAndVariant(input.cartId, input.variantId);
    const targetQuantity = (existing?.quantity ?? 0) + input.quantity;

    const available = await this.availability.getAvailability(input.variantId);
    if (available < targetQuantity) {
      throw new InsufficientInventoryError(available);
    }

    const subtotal = variantInfo.price * targetQuantity;

    if (existing) {
      await this.items.update(existing.id, {
        quantity: targetQuantity,
        unitPrice: variantInfo.price,
        subtotal,
      });
    } else {
      await this.items.create({
        cartId: input.cartId,
        productId: variantInfo.productId,
        variantId: input.variantId,
        sku: variantInfo.sku,
        quantity: targetQuantity,
        unitPrice: variantInfo.price,
        subtotal,
      });
    }

    const updated = await this.carts.findById(input.cartId);
    if (!updated) throw new CartNotFoundError();
    return updated;
  }
}
