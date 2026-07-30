import { Inject, Injectable } from '@nestjs/common';

import { CART_ITEM_REPOSITORY, CART_REPOSITORY } from '../../cart.constants';
import type { CartEntity } from '../../domain/entities/cart.entity';
import { CartItemNotFoundError, CartNotFoundError } from '../../domain/errors/cart.errors';
import type { CartRepositoryPort } from '../../domain/ports/cart.repository.port';
import type { CartItemRepositoryPort } from '../../domain/ports/cart-item.repository.port';

export interface RemoveCartItemInput {
  cartId: string;
  itemId: string;
}

@Injectable()
export class RemoveCartItemUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepositoryPort,
    @Inject(CART_ITEM_REPOSITORY) private readonly items: CartItemRepositoryPort,
  ) {}

  async execute(input: RemoveCartItemInput): Promise<CartEntity> {
    const item = await this.items.findById(input.itemId);
    if (!item || item.cartId !== input.cartId) throw new CartItemNotFoundError();

    await this.items.delete(item.id);

    const updated = await this.carts.findById(input.cartId);
    if (!updated) throw new CartNotFoundError();
    return updated;
  }
}
