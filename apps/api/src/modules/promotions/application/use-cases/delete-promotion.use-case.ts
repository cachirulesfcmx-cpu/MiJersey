import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { PromotionNotFoundError } from '../../domain/errors/promotions.errors';
import type { PromotionRepositoryPort } from '../../domain/ports/promotion.repository.port';
import { PROMOTION_REPOSITORY } from '../../promotions.constants';
import { CartCouponMirrorService } from '../services/cart-coupon-mirror.service';

export interface DeletePromotionInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeletePromotionUseCase {
  constructor(
    @Inject(PROMOTION_REPOSITORY) private readonly promotions: PromotionRepositoryPort,
    private readonly cartCouponMirror: CartCouponMirrorService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeletePromotionInput): Promise<void> {
    const existing = await this.promotions.findById(input.id);
    if (!existing) throw new PromotionNotFoundError();

    if (existing.code) await this.cartCouponMirror.remove(existing.code);
    await this.promotions.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'promotion.deleted',
      ipAddress: input.ipAddress,
      metadata: { promotionId: input.id },
    });
  }
}
