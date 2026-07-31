import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';

import { PromotionDiscountType, PromotionStatus } from '../../domain/value-objects/promotion-enums';
import { PromotionRuleDto } from './promotion-rule.dto';

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  code?: string;

  @IsOptional()
  @IsEnum(PromotionDiscountType)
  discountType?: PromotionDiscountType;

  @IsOptional()
  @IsPositive()
  discountValue?: number;

  @IsOptional()
  @IsEnum(PromotionStatus)
  status?: PromotionStatus;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @IsBoolean()
  stackable?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PromotionRuleDto)
  rules?: PromotionRuleDto[];
}
