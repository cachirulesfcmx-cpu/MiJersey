import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { PromotionEntity } from '../../domain/entities/promotion.entity';
import { PromotionCodeAlreadyExistsError } from '../../domain/errors/promotions.errors';
import type {
  CreatePromotionData,
  PromotionRepositoryPort,
} from '../../domain/ports/promotion.repository.port';
import { PROMOTION_REPOSITORY } from '../../promotions.constants';
import { CartCouponMirrorService } from '../services/cart-coupon-mirror.service';

export interface CreatePromotionInput extends CreatePromotionData {
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreatePromotionUseCase {
  constructor(
    @Inject(PROMOTION_REPOSITORY) private readonly promotions: PromotionRepositoryPort,
    private readonly cartCouponMirror: CartCouponMirrorService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreatePromotionInput): Promise<PromotionEntity> {
    const code = input.code ? input.code.trim().toUpperCase() : null;
    if (code) {
      const existing = await this.promotions.findByCode(code);
      if (existing) throw new PromotionCodeAlreadyExistsError();
    }

    const { actorUserId, ipAddress, ...data } = input;
    const created = await this.promotions.create({ ...data, code });
    await this.cartCouponMirror.sync(created);

    await this.auditLog.record({
      userId: actorUserId,
      action: 'promotion.created',
      ipAddress,
      metadata: { promotionId: created.id, code: created.code, type: created.type },
    });

    return created;
  }
}
