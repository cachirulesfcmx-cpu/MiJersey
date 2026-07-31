import { Inject, Injectable } from '@nestjs/common';

import { CART_REPOSITORY } from '../../../cart/cart.constants';
import type { CartRepositoryPort } from '../../../cart/domain/ports/cart.repository.port';
import { PRODUCT_DETAIL_LOOKUP } from '../../../catalog/catalog.constants';
import type { ProductDetailLookupPort } from '../../../catalog/domain/ports/product-detail-lookup.port';
import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { PromotionEntity } from '../../domain/entities/promotion.entity';
import {
  CartNotFoundError,
  InvalidPromotionCodeError,
  PromotionNotEligibleError,
} from '../../domain/errors/promotions.errors';
import type { PromotionRepositoryPort } from '../../domain/ports/promotion.repository.port';
import {
  calculateTotalDiscount,
  type EligibilityContext,
  isPromotionEligible,
  selectApplicablePromotions,
} from '../../domain/value-objects/promotion-eligibility.util';
import { PROMOTION_REPOSITORY } from '../../promotions.constants';

export interface ValidatePromotionInput {
  sessionId?: string;
  customerId?: string;
  code?: string;
}

export interface ValidatePromotionResult {
  applicable: PromotionEntity[];
  discountTotal: number;
  currency: string;
}

/**
 * `POST /promotions/validate` (spec §7): con `code`, valida un cupón manual específico (motor
 * completo de reglas — vigencia, límite de usos, producto/categoría/marca/cliente). Sin `code`,
 * evalúa las promociones `AUTOMATIC` elegibles y aplica la selección por prioridad/compatibilidad
 * (§4). El resultado es informativo: el descuento solo se refleja en el total real del carrito
 * cuando el código, además, está replicado en `Coupon` (017) — ver `Promotion.isMirrorableToCart`.
 */
@Injectable()
export class ValidatePromotionUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepositoryPort,
    @Inject(PRODUCT_DETAIL_LOOKUP) private readonly productLookup: ProductDetailLookupPort,
    @Inject(PROMOTION_REPOSITORY) private readonly promotions: PromotionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: ValidatePromotionInput): Promise<ValidatePromotionResult> {
    const cart = input.customerId
      ? await this.carts.findActiveByCustomerId(input.customerId)
      : input.sessionId
        ? await this.carts.findActiveBySessionId(input.sessionId)
        : null;
    if (!cart) throw new CartNotFoundError();

    const productIds = Array.from(new Set(cart.items.map((item) => item.productId)));
    const categoryIds = new Set<string>();
    const brandIds = new Set<string>();
    for (const productId of productIds) {
      const relations = await this.productLookup.findProductRelations(productId);
      relations.categoryIds.forEach((id) => categoryIds.add(id));
      if (relations.brandId) brandIds.add(relations.brandId);
    }

    const context: EligibilityContext = {
      now: new Date(),
      subtotal: cart.subtotal,
      customerId: input.customerId ?? null,
      productIds,
      categoryIds: Array.from(categoryIds),
      brandIds: Array.from(brandIds),
    };

    let applicable: PromotionEntity[];
    if (input.code) {
      const code = input.code.trim().toUpperCase();
      const promotion = await this.promotions.findByCode(code);
      if (!promotion || promotion.type !== 'MANUAL_COUPON') {
        await this.auditLog.record({
          userId: input.customerId ?? null,
          action: 'promotion.validation_rejected',
          ipAddress: null,
          metadata: { code, reason: 'NOT_FOUND' },
        });
        throw new InvalidPromotionCodeError();
      }
      if (!isPromotionEligible(promotion, context)) {
        await this.auditLog.record({
          userId: input.customerId ?? null,
          action: 'promotion.validation_rejected',
          ipAddress: null,
          metadata: { code, promotionId: promotion.id, reason: 'NOT_ELIGIBLE' },
        });
        throw new PromotionNotEligibleError();
      }
      applicable = [promotion];
    } else {
      const automatic = await this.promotions.findActiveAutomatic();
      const eligible = automatic.filter((promotion) => isPromotionEligible(promotion, context));
      applicable = selectApplicablePromotions(eligible);
    }

    return {
      applicable,
      discountTotal: calculateTotalDiscount(applicable, context.subtotal),
      currency: cart.currency,
    };
  }
}
