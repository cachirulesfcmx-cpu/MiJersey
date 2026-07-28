import type { SeoMetadataEntity } from '../entities/seo-metadata.entity';
import type {
  SeoEntityType,
  SeoRobotsDirective,
  SeoTwitterCardType,
} from '../value-objects/seo-enums';

export interface UpsertSeoMetadataData {
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;
  robots?: SeoRobotsDirective;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImageMediaId?: string | null;
  twitterCard?: SeoTwitterCardType;
  structuredData?: Record<string, unknown> | null;
}

export interface SeoMetadataRepositoryPort {
  findByEntity(entityType: SeoEntityType, entityId: string): Promise<SeoMetadataEntity | null>;
  /** Crea el registro si no existe, o lo actualiza — spec §4 "cada entidad tendrá como máximo un registro SEO". */
  upsert(
    entityType: SeoEntityType,
    entityId: string,
    data: UpsertSeoMetadataData,
  ): Promise<SeoMetadataEntity>;
}
