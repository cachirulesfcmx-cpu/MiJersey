import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { CART_REPOSITORY, COUPON_REPOSITORY } from '../../cart.constants';
import type { CartEntity } from '../../domain/entities/cart.entity';
import {
  CartNotFoundError,
  CouponExpiredError,
  CouponInactiveError,
  CouponNotFoundError,
} from '../../domain/errors/cart.errors';
import type { CartRepositoryPort } from '../../domain/ports/cart.repository.port';
import type { CouponRepositoryPort } from '../../domain/ports/coupon.repository.port';

export interface ApplyCouponInput {
  cartId: string;
  code: string;
  sessionId: string;
}

@Injectable()
export class ApplyCouponUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepositoryPort,
    @Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: ApplyCouponInput): Promise<CartEntity> {
    const cart = await this.carts.findById(input.cartId);
    if (!cart) throw new CartNotFoundError();

    const code = input.code.trim().toUpperCase();
    const coupon = await this.coupons.findByCode(code);
    if (!coupon) throw new CouponNotFoundError();
    if (!coupon.isActive) throw new CouponInactiveError();
    if (coupon.isExpired) throw new CouponExpiredError();

    const updated = await this.carts.setCoupon(input.cartId, coupon.code);

    await this.auditLog.record({
      userId: cart.customerId,
      action: 'cart.coupon.applied',
      ipAddress: null,
      metadata: { cartId: cart.id, sessionId: input.sessionId, couponCode: coupon.code },
    });

    return updated;
  }
}
