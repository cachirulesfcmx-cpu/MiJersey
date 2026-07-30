import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { CHECKOUT_SESSION_REPOSITORY, SHIPPING_METHOD_REPOSITORY } from '../../checkout.constants';
import type { CheckoutSessionEntity } from '../../domain/entities/checkout-session.entity';
import {
  CheckoutSessionNotFoundError,
  ShippingAddressRequiredError,
  ShippingMethodInactiveError,
  ShippingMethodNotFoundError,
} from '../../domain/errors/checkout.errors';
import type { CheckoutSessionRepositoryPort } from '../../domain/ports/checkout-session.repository.port';
import type { ShippingMethodRepositoryPort } from '../../domain/ports/shipping-method.repository.port';

export interface SetCheckoutShippingMethodInput {
  checkoutSessionId: string;
  shippingMethodId: string;
}

/** Requiere dirección de envío ya capturada (spec §3: la dirección va antes que el método de envío en el flujo). */
@Injectable()
export class SetCheckoutShippingMethodUseCase {
  constructor(
    @Inject(CHECKOUT_SESSION_REPOSITORY)
    private readonly sessions: CheckoutSessionRepositoryPort,
    @Inject(SHIPPING_METHOD_REPOSITORY)
    private readonly shippingMethods: ShippingMethodRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: SetCheckoutShippingMethodInput): Promise<CheckoutSessionEntity> {
    const session = await this.sessions.findById(input.checkoutSessionId);
    if (!session) throw new CheckoutSessionNotFoundError();
    if (!session.shippingAddressId) throw new ShippingAddressRequiredError();

    const method = await this.shippingMethods.findById(input.shippingMethodId);
    if (!method) throw new ShippingMethodNotFoundError();
    if (!method.isActive) throw new ShippingMethodInactiveError();

    const updated = await this.sessions.update(session.id, { shippingMethodId: method.id });

    await this.auditLog.record({
      userId: session.customerId,
      action: 'checkout.shipping_set',
      ipAddress: null,
      metadata: { checkoutSessionId: session.id, shippingMethodId: method.id },
    });

    return updated;
  }
}
