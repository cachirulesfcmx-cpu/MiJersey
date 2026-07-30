import { Inject, Injectable } from '@nestjs/common';

import { CART_REPOSITORY, DEFAULT_CURRENCY } from '../../cart.constants';
import type { CartEntity } from '../../domain/entities/cart.entity';
import type { CartRepositoryPort } from '../../domain/ports/cart.repository.port';

export interface GetOrCreateCartInput {
  sessionId: string;
  customerId?: string | null;
}

/**
 * Resuelve "el" carrito activo del visitante (spec §4 "un cliente tendrá un carrito activo").
 * Si ya es cliente y tiene carrito propio, ese manda sobre cualquier carrito de invitado de la sesión actual.
 * Si es cliente sin carrito propio pero su sesión actual sí tiene uno anónimo, lo adopta (sin necesidad
 * de pasar por `POST /cart/merge`, que es solo para el caso con dos carritos reales que fusionar).
 */
@Injectable()
export class GetOrCreateCartUseCase {
  constructor(@Inject(CART_REPOSITORY) private readonly carts: CartRepositoryPort) {}

  async execute(input: GetOrCreateCartInput): Promise<CartEntity> {
    if (input.customerId) {
      const customerCart = await this.carts.findActiveByCustomerId(input.customerId);
      if (customerCart) return customerCart;

      const sessionCart = await this.carts.findActiveBySessionId(input.sessionId);
      if (sessionCart && !sessionCart.customerId) {
        return this.carts.attachCustomer(sessionCart.id, input.customerId);
      }
      if (sessionCart) return sessionCart;

      return this.carts.create({
        sessionId: input.sessionId,
        customerId: input.customerId,
        currency: DEFAULT_CURRENCY,
      });
    }

    const guestCart = await this.carts.findActiveBySessionId(input.sessionId);
    if (guestCart) return guestCart;

    return this.carts.create({ sessionId: input.sessionId, currency: DEFAULT_CURRENCY });
  }
}
