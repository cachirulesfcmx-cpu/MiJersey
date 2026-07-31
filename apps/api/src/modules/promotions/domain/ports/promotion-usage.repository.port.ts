import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { PromotionUsageEntity } from '../entities/promotion-usage.entity';

export interface CreateUsageData {
  promotionId: string;
  orderId: string;
  customerId: string | null;
  discountAmount: number;
}

export interface PromotionUsageView {
  id: string;
  promotionId: string;
  promotionName: string;
  promotionCode: string | null;
  orderId: string;
  customerId: string | null;
  discountAmount: number;
  createdAt: Date;
}

export interface PromotionUsageRepositoryPort {
  findByOrderId(orderId: string): Promise<PromotionUsageEntity | null>;
  create(data: CreateUsageData): Promise<PromotionUsageEntity>;
  findMany(params: PaginationParams): Promise<PaginatedResult<PromotionUsageView>>;
}
