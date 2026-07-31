import { Inject, Injectable } from '@nestjs/common';

import type { PromotionEntity } from '../../domain/entities/promotion.entity';
import { PromotionNotFoundError } from '../../domain/errors/promotions.errors';
import type { PromotionRepositoryPort } from '../../domain/ports/promotion.repository.port';
import { PROMOTION_REPOSITORY } from '../../promotions.constants';

@Injectable()
export class GetPromotionUseCase {
  constructor(@Inject(PROMOTION_REPOSITORY) private readonly promotions: PromotionRepositoryPort) {}

  async execute(id: string): Promise<PromotionEntity> {
    const promotion = await this.promotions.findById(id);
    if (!promotion) throw new PromotionNotFoundError();
    return promotion;
  }
}
