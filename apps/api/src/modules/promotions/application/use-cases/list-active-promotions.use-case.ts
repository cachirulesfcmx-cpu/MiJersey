import { Inject, Injectable } from '@nestjs/common';

import type { PromotionEntity } from '../../domain/entities/promotion.entity';
import type { PromotionRepositoryPort } from '../../domain/ports/promotion.repository.port';
import { isPromotionCurrentlyValid } from '../../domain/value-objects/promotion-eligibility.util';
import { PROMOTION_REPOSITORY } from '../../promotions.constants';

/** Promotion Banner (spec 024 §6): promociones automáticas vigentes y con cupo disponible, sin evaluar reglas de carrito — se muestran como anuncio general ("envío gratis en compras mayores a $X"), no como algo ya aplicado. */
@Injectable()
export class ListActivePromotionsUseCase {
  constructor(@Inject(PROMOTION_REPOSITORY) private readonly promotions: PromotionRepositoryPort) {}

  async execute(): Promise<PromotionEntity[]> {
    const automatic = await this.promotions.findActiveAutomatic();
    const now = new Date();
    return automatic.filter(
      (promotion) =>
        isPromotionCurrentlyValid(promotion, now) &&
        (promotion.usageLimit === null || promotion.usageCount < promotion.usageLimit),
    );
  }
}
