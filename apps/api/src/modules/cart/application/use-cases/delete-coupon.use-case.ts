import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { COUPON_REPOSITORY } from '../../cart.constants';
import { CouponNotFoundError } from '../../domain/errors/cart.errors';
import type { CouponRepositoryPort } from '../../domain/ports/coupon.repository.port';

export interface DeleteCouponInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteCouponInput): Promise<void> {
    const existing = await this.coupons.findById(input.id);
    if (!existing) throw new CouponNotFoundError();

    await this.coupons.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'cart.coupon.deleted',
      ipAddress: input.ipAddress,
      metadata: { couponId: input.id, code: existing.code },
    });
  }
}
