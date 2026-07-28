import { IsEnum, IsObject, IsOptional, IsString, IsUUID, Length } from 'class-validator';

import { SeoRobotsDirective, SeoTwitterCardType } from '../../domain/value-objects/seo-enums';

export class UpsertSeoMetadataDto {
  @IsOptional()
  @IsString()
  @Length(0, 70)
  metaTitle?: string | null;

  @IsOptional()
  @IsString()
  @Length(0, 160)
  metaDescription?: string | null;

  @IsOptional()
  @IsString()
  metaKeywords?: string | null;

  @IsOptional()
  @IsString()
  canonicalUrl?: string | null;

  @IsOptional()
  @IsEnum(SeoRobotsDirective)
  robots?: SeoRobotsDirective;

  @IsOptional()
  @IsString()
  @Length(0, 70)
  ogTitle?: string | null;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  ogDescription?: string | null;

  @IsOptional()
  @IsUUID()
  ogImageMediaId?: string | null;

  @IsOptional()
  @IsEnum(SeoTwitterCardType)
  twitterCard?: SeoTwitterCardType;

  @IsOptional()
  @IsObject()
  structuredData?: Record<string, unknown> | null;
}
