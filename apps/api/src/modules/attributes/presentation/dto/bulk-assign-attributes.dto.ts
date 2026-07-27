import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';

import { AssignAttributeDto } from './assign-attribute.dto';

export class BulkAssignAttributesDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => AssignAttributeDto)
  items!: AssignAttributeDto[];
}
