import { Inject, Injectable } from '@nestjs/common';

import { COUPON_REPOSITORY } from '../../../cart/cart.constants';
import type { CouponRepositoryPort } from '../../../cart/domain/ports/coupon.repository.port';
import { CouponType } from '../../../cart/domain/value-objects/cart-enums';
import type { PromotionEntity } from '../../domain/entities/promotion.entity';

/**
 * Sincroniza el `Coupon` mínimo de Cart (017) con las promociones de 024 que son replicables 1:1
 * (`MANUAL_COUPON` sin reglas — ver `Promotion.isMirrorableToCart`). Es el único punto de escritura
 * en la tabla de Cart desde este módulo, y usa exclusivamente `COUPON_REPOSITORY` (ya exportado por
 * `CartModule`) — cero cambios estructurales en Cart/Checkout.
 */
@Injectable()
export class CartCouponMirrorService {
  constructor(@Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepositoryPort) {}

  async sync(promotion: PromotionEntity): Promise<void> {
    if (!promotion.isMirrorableToCart || !promotion.code) {
      if (promotion.code) await this.remove(promotion.code);
      return;
    }

    const data = {
      type: promotion.discountType === 'PERCENTAGE' ? CouponType.PERCENTAGE : CouponType.FIXED,
      value: promotion.discountValue,
      isActive: promotion.status === 'ACTIVE',
      expiresAt: promotion.endsAt,
    };

    const existing = await this.coupons.findByCode(promotion.code);
    if (existing) {
      await this.coupons.update(existing.id, data);
    } else {
      await this.coupons.create({ code: promotion.code, ...data });
    }
  }

  async remove(code: string): Promise<void> {
    const existing = await this.coupons.findByCode(code);
    if (existing) await this.coupons.delete(existing.id);
  }
}
