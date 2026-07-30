import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { COUPON_REPOSITORY } from '../../cart.constants';
import { CouponEntity } from '../../domain/entities/coupon.entity';
import { CouponNotFoundError } from '../../domain/errors/cart.errors';
import type { CouponRepositoryPort } from '../../domain/ports/coupon.repository.port';
import type { CouponType } from '../../domain/value-objects/cart-enums';

export interface UpdateCouponInput {
  id: string;
  type?: CouponType;
  value?: number;
  isActive?: boolean;
  expiresAt?: Date | null;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateCouponInput): Promise<CouponEntity> {
    const existing = await this.coupons.findById(input.id);
    if (!existing) throw new CouponNotFoundError();

    const updated = await this.coupons.update(input.id, {
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.value !== undefined ? { value: input.value } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'cart.coupon.updated',
      ipAddress: input.ipAddress,
      metadata: { couponId: updated.id, code: updated.code },
    });

    return updated;
  }
}
