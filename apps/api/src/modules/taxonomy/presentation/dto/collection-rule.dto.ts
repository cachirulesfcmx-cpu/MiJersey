import { IsIn, IsString, Length } from 'class-validator';

import {
  CollectionRuleField,
  CollectionRuleOperator,
} from '../../domain/value-objects/taxonomy-enums';

export class CollectionRuleDto {
  @IsIn(Object.values(CollectionRuleField))
  field!: CollectionRuleField;

  @IsIn(Object.values(CollectionRuleOperator))
  operator!: CollectionRuleOperator;

  @IsString()
  @Length(1, 200)
  value!: string;
}
