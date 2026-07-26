import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  Length,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { CollectionRuleMatchType, CollectionType } from '../../domain/value-objects/taxonomy-enums';
import { CollectionRuleDto } from './collection-rule.dto';

export class CreateCollectionDto {
  @IsOptional()
  @IsString()
  @Length(1, 96)
  slug?: string;

  @IsString()
  @Length(1, 150)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(Object.values(CollectionType))
  type!: CollectionType;

  @IsOptional()
  @IsIn(Object.values(CollectionRuleMatchType))
  matchType?: CollectionRuleMatchType;

  @ValidateIf((dto: CreateCollectionDto) => dto.type === CollectionType.SMART)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CollectionRuleDto)
  rules?: CollectionRuleDto[];
}
