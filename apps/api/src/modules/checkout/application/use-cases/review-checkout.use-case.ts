import { Inject, Injectable } from '@nestjs/common';

import { CHECKOUT_SESSION_REPOSITORY } from '../../checkout.constants';
import {
  CartEmptyError,
  CartItemsUnavailableError,
  CheckoutSessionNotFoundError,
  ShippingAddressRequiredError,
  ShippingMethodRequiredError,
} from '../../domain/errors/checkout.errors';
import type { CheckoutSessionRepositoryPort } from '../../domain/ports/checkout-session.repository.port';
import type { CheckoutView } from '../../domain/value-objects/checkout-view';
import { BuildCheckoutViewUseCase } from './build-checkout-view.use-case';

export interface ReviewCheckoutInput {
  checkoutSessionId: string;
}

/** "Revisión del pedido" (spec §3 paso 5): valida que el checkout esté completo y que el carrito siga siendo comprable, y devuelve la foto recalculada (subtotal/descuento/envío/impuesto/total). Es una validación *blanda* de apoyo a la UI — la validación definitiva (con relectura de precios) ocurre en `ConfirmCheckoutUseCase`, la única que de verdad congela algo. */
@Injectable()
export class ReviewCheckoutUseCase {
  constructor(
    @Inject(CHECKOUT_SESSION_REPOSITORY)
    private readonly sessions: CheckoutSessionRepositoryPort,
    private readonly buildView: BuildCheckoutViewUseCase,
  ) {}

  async execute(input: ReviewCheckoutInput): Promise<CheckoutView> {
    const session = await this.sessions.findById(input.checkoutSessionId);
    if (!session) throw new CheckoutSessionNotFoundError();
    if (!session.shippingAddressId) throw new ShippingAddressRequiredError();
    if (!session.shippingMethodId) throw new ShippingMethodRequiredError();

    const view = await this.buildView.execute(session);
    if (view.cart.items.length === 0) throw new CartEmptyError();

    const unavailable = view.cart.items.filter((item) => !item.inStock);
    if (unavailable.length > 0) {
      throw new CartItemsUnavailableError(unavailable.map((item) => item.sku));
    }

    return view;
  }
}
