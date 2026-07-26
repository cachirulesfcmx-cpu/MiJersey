import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsIn, ValidateNested } from 'class-validator';

import { CollectionRuleMatchType } from '../../domain/value-objects/taxonomy-enums';
import { CollectionRuleDto } from './collection-rule.dto';

export class UpdateCollectionRulesDto {
  @IsIn(Object.values(CollectionRuleMatchType))
  matchType!: CollectionRuleMatchType;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CollectionRuleDto)
  rules!: CollectionRuleDto[];
}
