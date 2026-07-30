import { Inject, Injectable } from '@nestjs/common';

import {
  CART_INVENTORY_AVAILABILITY,
  CART_ITEM_REPOSITORY,
  CART_PRODUCT_LOOKUP,
  CART_REPOSITORY,
} from '../../cart.constants';
import type { CartEntity } from '../../domain/entities/cart.entity';
import {
  CartItemNotFoundError,
  CartNotFoundError,
  InsufficientInventoryError,
  ProductNotAvailableError,
} from '../../domain/errors/cart.errors';
import type { CartRepositoryPort } from '../../domain/ports/cart.repository.port';
import type { CartInventoryAvailabilityPort } from '../../domain/ports/cart-inventory-availability.port';
import type { CartItemRepositoryPort } from '../../domain/ports/cart-item.repository.port';
import type { CartProductLookupPort } from '../../domain/ports/cart-product-lookup.port';

export interface UpdateCartItemInput {
  cartId: string;
  itemId: string;
  quantity: number;
}

@Injectable()
export class UpdateCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepositoryPort,
    @Inject(CART_ITEM_REPOSITORY) private readonly items: CartItemRepositoryPort,
    @Inject(CART_PRODUCT_LOOKUP) private readonly productLookup: CartProductLookupPort,
    @Inject(CART_INVENTORY_AVAILABILITY)
    private readonly availability: CartInventoryAvailabilityPort,
  ) {}

  async execute(input: UpdateCartItemInput): Promise<CartEntity> {
    const item = await this.items.findById(input.itemId);
    if (!item || item.cartId !== input.cartId) throw new CartItemNotFoundError();

    const variantInfo = await this.productLookup.findVariantInfo(item.variantId);
    if (!variantInfo || !variantInfo.isAvailableForSale) {
      throw new ProductNotAvailableError();
    }

    const available = await this.availability.getAvailability(item.variantId);
    if (available < input.quantity) {
      throw new InsufficientInventoryError(available);
    }

    await this.items.update(item.id, {
      quantity: input.quantity,
      unitPrice: variantInfo.price,
      subtotal: variantInfo.price * input.quantity,
    });

    const updated = await this.carts.findById(input.cartId);
    if (!updated) throw new CartNotFoundError();
    return updated;
  }
}
