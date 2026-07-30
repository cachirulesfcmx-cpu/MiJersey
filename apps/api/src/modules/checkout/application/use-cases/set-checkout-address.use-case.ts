import { Inject, Injectable } from '@nestjs/common';

import { CART_REPOSITORY } from '../../../cart/cart.constants';
import { CartNotFoundError } from '../../../cart/domain/errors/cart.errors';
import type { CartRepositoryPort } from '../../../cart/domain/ports/cart.repository.port';
import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { CHECKOUT_ADDRESS_REPOSITORY, CHECKOUT_SESSION_REPOSITORY } from '../../checkout.constants';
import type { CheckoutSessionEntity } from '../../domain/entities/checkout-session.entity';
import { CartEmptyError, CheckoutSessionNotFoundError } from '../../domain/errors/checkout.errors';
import type {
  CheckoutAddressRepositoryPort,
  CreateCheckoutAddressData,
} from '../../domain/ports/checkout-address.repository.port';
import type { CheckoutSessionRepositoryPort } from '../../domain/ports/checkout-session.repository.port';

export interface SetCheckoutAddressInput {
  checkoutSessionId: string;
  contactEmail: string;
  shipping: CreateCheckoutAddressData;
  /** Si se omite, se factura a la misma dirección de envío (caso más común, spec §3 pasos 2-3). */
  billing?: CreateCheckoutAddressData;
}

@Injectable()
export class SetCheckoutAddressUseCase {
  constructor(
    @Inject(CHECKOUT_SESSION_REPOSITORY)
    private readonly sessions: CheckoutSessionRepositoryPort,
    @Inject(CHECKOUT_ADDRESS_REPOSITORY)
    private readonly addresses: CheckoutAddressRepositoryPort,
    @Inject(CART_REPOSITORY) private readonly carts: CartRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: SetCheckoutAddressInput): Promise<CheckoutSessionEntity> {
    const session = await this.sessions.findById(input.checkoutSessionId);
    if (!session) throw new CheckoutSessionNotFoundError();

    const cart = await this.carts.findById(session.cartId);
    if (!cart) throw new CartNotFoundError();
    if (cart.items.length === 0) throw new CartEmptyError();

    const shippingAddress = await this.addresses.create(input.shipping);
    const billingAddress = input.billing
      ? await this.addresses.create(input.billing)
      : shippingAddress;

    const updated = await this.sessions.update(session.id, {
      contactEmail: input.contactEmail,
      shippingAddressId: shippingAddress.id,
      billingAddressId: billingAddress.id,
    });

    await this.auditLog.record({
      userId: session.customerId,
      action: 'checkout.address_set',
      ipAddress: null,
      metadata: { checkoutSessionId: session.id, cartId: session.cartId },
    });

    return updated;
  }
}
