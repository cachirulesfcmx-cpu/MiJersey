import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { PromotionEntity } from '../entities/promotion.entity';
import type {
  PromotionDiscountType,
  PromotionRuleOperator,
  PromotionRuleType,
  PromotionStatus,
  PromotionType,
} from '../value-objects/promotion-enums';

export interface CreateRuleData {
  ruleType: PromotionRuleType;
  operator: PromotionRuleOperator;
  value: string;
}

export interface CreatePromotionData {
  name: string;
  code?: string | null;
  type: PromotionType;
  discountType: PromotionDiscountType;
  discountValue: number;
  status?: PromotionStatus;
  priority?: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  usageLimit?: number | null;
  stackable?: boolean;
  rules: CreateRuleData[];
}

export interface UpdatePromotionData {
  name?: string;
  code?: string | null;
  discountType?: PromotionDiscountType;
  discountValue?: number;
  status?: PromotionStatus;
  priority?: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  usageLimit?: number | null;
  stackable?: boolean;
  /** Reemplazo completo de las reglas existentes, cuando se envía. */
  rules?: CreateRuleData[];
}

export interface ListPromotionsParams extends PaginationParams {
  status?: PromotionStatus;
}

export interface PromotionRepositoryPort {
  findById(id: string): Promise<PromotionEntity | null>;
  findByCode(code: string): Promise<PromotionEntity | null>;
  /** Promociones `AUTOMATIC` vigentes por estado — la fecha se filtra en el caso de uso. */
  findActiveAutomatic(): Promise<PromotionEntity[]>;
  findMany(params: ListPromotionsParams): Promise<PaginatedResult<PromotionEntity>>;
  create(data: CreatePromotionData): Promise<PromotionEntity>;
  update(id: string, data: UpdatePromotionData): Promise<PromotionEntity>;
  delete(id: string): Promise<void>;
  incrementUsageCount(id: string): Promise<void>;
}
