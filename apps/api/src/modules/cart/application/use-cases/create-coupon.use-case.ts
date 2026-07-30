import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { COUPON_REPOSITORY } from '../../cart.constants';
import { CouponEntity } from '../../domain/entities/coupon.entity';
import { CouponAlreadyExistsError } from '../../domain/errors/cart.errors';
import type { CouponRepositoryPort } from '../../domain/ports/coupon.repository.port';
import type { CouponType } from '../../domain/value-objects/cart-enums';

export interface CreateCouponInput {
  code: string;
  type: CouponType;
  value: number;
  isActive?: boolean;
  expiresAt?: Date | null;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateCouponUseCase {
  constructor(
    @Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateCouponInput): Promise<CouponEntity> {
    const code = input.code.trim().toUpperCase();
    const existing = await this.coupons.findByCode(code);
    if (existing) throw new CouponAlreadyExistsError();

    const created = await this.coupons.create({
      code,
      type: input.type,
      value: input.value,
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'cart.coupon.created',
      ipAddress: input.ipAddress,
      metadata: { couponId: created.id, code: created.code },
    });

    return created;
  }
}
