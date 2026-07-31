import { IsEnum, IsString, Length } from 'class-validator';

import {
  PromotionRuleOperator,
  PromotionRuleType,
} from '../../domain/value-objects/promotion-enums';

export class PromotionRuleDto {
  @IsEnum(PromotionRuleType)
  ruleType!: PromotionRuleType;

  @IsEnum(PromotionRuleOperator)
  operator!: PromotionRuleOperator;

  @IsString()
  @Length(1, 500)
  value!: string;
}
