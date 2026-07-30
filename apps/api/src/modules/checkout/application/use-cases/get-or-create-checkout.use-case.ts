import { Inject, Injectable } from '@nestjs/common';

import { GetOrCreateCartUseCase } from '../../../cart/application/use-cases/get-or-create-cart.use-case';
import { CHECKOUT_SESSION_REPOSITORY } from '../../checkout.constants';
import type { CheckoutSessionEntity } from '../../domain/entities/checkout-session.entity';
import type { CheckoutSessionRepositoryPort } from '../../domain/ports/checkout-session.repository.port';

export interface GetOrCreateCheckoutInput {
  sessionId: string;
  customerId?: string | null;
}

/** Resuelve el carrito vigente (delegado a Cart) y su sesión de checkout — una por carrito (`cartId` único en `schema.prisma`, spec §5 "una única sesión activa por carrito"). Como un carrito ya `CONVERTED` nunca vuelve a ser "el" carrito activo (Cart lo excluye de sus búsquedas), esta unicidad basta sin lógica adicional de "cerrar" sesiones viejas. */
@Injectable()
export class GetOrCreateCheckoutUseCase {
  constructor(
    @Inject(CHECKOUT_SESSION_REPOSITORY)
    private readonly sessions: CheckoutSessionRepositoryPort,
    private readonly getOrCreateCart: GetOrCreateCartUseCase,
  ) {}

  async execute(input: GetOrCreateCheckoutInput): Promise<CheckoutSessionEntity> {
    const cart = await this.getOrCreateCart.execute(input);

    const existing = await this.sessions.findByCartId(cart.id);
    if (existing) return existing;

    return this.sessions.create({
      cartId: cart.id,
      customerId: input.customerId ?? null,
      sessionId: input.sessionId,
    });
  }
}
