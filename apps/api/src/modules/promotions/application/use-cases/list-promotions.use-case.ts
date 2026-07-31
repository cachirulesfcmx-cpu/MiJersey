import type { PaginatedResult } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type { PromotionEntity } from '../../domain/entities/promotion.entity';
import type {
  ListPromotionsParams,
  PromotionRepositoryPort,
} from '../../domain/ports/promotion.repository.port';
import { PROMOTION_REPOSITORY } from '../../promotions.constants';

@Injectable()
export class ListPromotionsUseCase {
  constructor(@Inject(PROMOTION_REPOSITORY) private readonly promotions: PromotionRepositoryPort) {}

  async execute(params: ListPromotionsParams): Promise<PaginatedResult<PromotionEntity>> {
    return this.promotions.findMany(params);
  }
}
