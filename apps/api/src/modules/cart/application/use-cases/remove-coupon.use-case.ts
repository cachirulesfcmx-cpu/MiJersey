import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { CART_REPOSITORY } from '../../cart.constants';
import type { CartEntity } from '../../domain/entities/cart.entity';
import { CartNotFoundError, NoCouponAppliedError } from '../../domain/errors/cart.errors';
import type { CartRepositoryPort } from '../../domain/ports/cart.repository.port';

export interface RemoveCouponInput {
  cartId: string;
  sessionId: string;
}

@Injectable()
export class RemoveCouponUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: RemoveCouponInput): Promise<CartEntity> {
    const cart = await this.carts.findById(input.cartId);
    if (!cart) throw new CartNotFoundError();
    if (!cart.couponCode) throw new NoCouponAppliedError();

    const removedCode = cart.couponCode;
    const updated = await this.carts.setCoupon(input.cartId, null);

    await this.auditLog.record({
      userId: cart.customerId,
      action: 'cart.coupon.removed',
      ipAddress: null,
      metadata: { cartId: cart.id, sessionId: input.sessionId, couponCode: removedCode },
    });

    return updated;
  }
}
