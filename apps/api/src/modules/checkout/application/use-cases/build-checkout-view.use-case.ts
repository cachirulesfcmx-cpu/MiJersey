import { Inject, Injectable } from '@nestjs/common';

import { BuildCartViewUseCase } from '../../../cart/application/use-cases/build-cart-view.use-case';
import { CART_REPOSITORY } from '../../../cart/cart.constants';
import { CartNotFoundError } from '../../../cart/domain/errors/cart.errors';
import type { CartRepositoryPort } from '../../../cart/domain/ports/cart.repository.port';
import {
  CHECKOUT_ADDRESS_REPOSITORY,
  SHIPPING_METHOD_REPOSITORY,
  TAX_RATE,
} from '../../checkout.constants';
import type { CheckoutSessionEntity } from '../../domain/entities/checkout-session.entity';
import type { CheckoutAddressRepositoryPort } from '../../domain/ports/checkout-address.repository.port';
import type { ShippingMethodRepositoryPort } from '../../domain/ports/shipping-method.repository.port';
import type { CheckoutView } from '../../domain/value-objects/checkout-view';

/** Compone la respuesta pública de un checkout: carrito vigente (delegado a `BuildCartViewUseCase` de Cart) + direcciones/método de envío propios + impuesto y gran total calculados en caliente sobre `(cart.total + envío)`. Nada de esto se persiste — la foto definitiva solo existe en `Order`, creada por `ConfirmCheckoutUseCase`. */
@Injectable()
export class BuildCheckoutViewUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepositoryPort,
    @Inject(CHECKOUT_ADDRESS_REPOSITORY)
    private readonly addresses: CheckoutAddressRepositoryPort,
    @Inject(SHIPPING_METHOD_REPOSITORY)
    private readonly shippingMethods: ShippingMethodRepositoryPort,
    private readonly buildCartView: BuildCartViewUseCase,
  ) {}

  async execute(session: CheckoutSessionEntity): Promise<CheckoutView> {
    const cart = await this.carts.findById(session.cartId);
    if (!cart) throw new CartNotFoundError();

    const addressIds = [session.shippingAddressId, session.billingAddressId].filter(
      (id): id is string => !!id,
    );

    const [cartView, addressMap, shippingMethod] = await Promise.all([
      this.buildCartView.execute(cart),
      this.addresses.findByIds(addressIds),
      session.shippingMethodId ? this.shippingMethods.findById(session.shippingMethodId) : null,
    ]);

    const shippingAddress = session.shippingAddressId
      ? (addressMap.get(session.shippingAddressId) ?? null)
      : null;
    const billingAddress = session.billingAddressId
      ? (addressMap.get(session.billingAddressId) ?? null)
      : null;

    const shippingCost = shippingMethod?.basePrice ?? 0;
    const taxableBase = cartView.total + shippingCost;
    const taxAmount = Math.round(taxableBase * TAX_RATE * 100) / 100;

    return {
      id: session.id,
      cartId: session.cartId,
      customerId: session.customerId,
      sessionId: session.sessionId,
      contactEmail: session.contactEmail,
      status: session.status,
      cart: cartView,
      shippingAddress: shippingAddress?.toJSON() ?? null,
      billingAddress: billingAddress?.toJSON() ?? null,
      shippingMethod: shippingMethod?.toJSON() ?? null,
      shippingCost,
      taxAmount,
      grandTotal: taxableBase + taxAmount,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
