import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

import { AttributeType } from '../../domain/value-objects/attribute-enums';
import { AttributeValueDto } from './attribute-value.dto';

export class CreateAttributeDto {
  @IsOptional()
  @IsString()
  @Length(1, 64)
  code?: string;

  @IsString()
  @Length(1, 150)
  name!: string;

  @IsEnum(AttributeType)
  type!: AttributeType;

  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @IsOptional()
  @IsBoolean()
  isComparable?: boolean;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeValueDto)
  values?: AttributeValueDto[];
}
