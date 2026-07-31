import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type {
  PromotionUsageRepositoryPort,
  PromotionUsageView,
} from '../../domain/ports/promotion-usage.repository.port';
import { PROMOTION_USAGE_REPOSITORY } from '../../promotions.constants';

/** Usage Dashboard (spec 024 §6). */
@Injectable()
export class ListPromotionUsageUseCase {
  constructor(
    @Inject(PROMOTION_USAGE_REPOSITORY) private readonly usages: PromotionUsageRepositoryPort,
  ) {}

  async execute(params: PaginationParams): Promise<PaginatedResult<PromotionUsageView>> {
    return this.usages.findMany(params);
  }
}
