import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { PromotionEntity } from '../../domain/entities/promotion.entity';
import {
  PromotionCodeAlreadyExistsError,
  PromotionNotFoundError,
} from '../../domain/errors/promotions.errors';
import type {
  PromotionRepositoryPort,
  UpdatePromotionData,
} from '../../domain/ports/promotion.repository.port';
import { PROMOTION_REPOSITORY } from '../../promotions.constants';
import { CartCouponMirrorService } from '../services/cart-coupon-mirror.service';

export interface UpdatePromotionInput extends UpdatePromotionData {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdatePromotionUseCase {
  constructor(
    @Inject(PROMOTION_REPOSITORY) private readonly promotions: PromotionRepositoryPort,
    private readonly cartCouponMirror: CartCouponMirrorService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdatePromotionInput): Promise<PromotionEntity> {
    const existing = await this.promotions.findById(input.id);
    if (!existing) throw new PromotionNotFoundError();

    const code =
      input.code !== undefined ? (input.code ? input.code.trim().toUpperCase() : null) : undefined;
    if (code && code !== existing.code) {
      const codeOwner = await this.promotions.findByCode(code);
      if (codeOwner) throw new PromotionCodeAlreadyExistsError();
    }

    const { id, actorUserId, ipAddress, ...data } = input;
    const updated = await this.promotions.update(id, {
      ...data,
      ...(code !== undefined ? { code } : {}),
    });

    if (existing.code && existing.code !== updated.code) {
      await this.cartCouponMirror.remove(existing.code);
    }
    await this.cartCouponMirror.sync(updated);

    await this.auditLog.record({
      userId: actorUserId,
      action: 'promotion.updated',
      ipAddress,
      metadata: { promotionId: id },
    });

    return updated;
  }
}
