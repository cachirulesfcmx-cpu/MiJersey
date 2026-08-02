import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

import { NavigationItemType } from '../../domain/value-objects/navigation-enums';

export class NavigationItemDto {
  @IsString()
  @Length(1, 100)
  tempId!: string;

  @IsOptional()
  @IsString()
  parentTempId?: string;

  @IsString()
  @Length(1, 100)
  label!: string;

  @IsEnum(NavigationItemType)
  type!: NavigationItemType;

  @IsString()
  @Length(1, 500)
  target!: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  icon?: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;

  @IsOptional()
  @IsObject()
  visibilityRules?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  openInNewTab?: boolean;
}
