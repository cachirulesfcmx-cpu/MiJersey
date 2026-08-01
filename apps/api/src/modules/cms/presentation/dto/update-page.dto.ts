import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';

import { PageBlockDto } from './page-block.dto';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(SLUG_PATTERN, { message: 'slug debe contener solo minúsculas, números y guiones' })
  slug?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  template?: string;

  @IsOptional()
  @IsString()
  @Length(1, 70)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  seoDescription?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PageBlockDto)
  blocks?: PageBlockDto[];
}
