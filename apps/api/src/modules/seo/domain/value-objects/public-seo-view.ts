import type { SeoMetadataEntity } from '../entities/seo-metadata.entity';
import { SeoRobotsDirective, SeoTwitterCardType } from './seo-enums';

export interface PublicSeoView {
  metaTitle: string;
  metaDescription: string | null;
  canonicalUrl: string;
  robots: SeoRobotsDirective;
  ogTitle: string;
  ogDescription: string | null;
  ogImageUrl: string | null;
  twitterCard: SeoTwitterCardType;
  structuredData: Record<string, unknown> | null;
}

export interface PublicSeoFallback {
  title: string;
  description: string | null;
  url: string;
}

/**
 * Combina el `SeoMetadata` guardado (si existe) con valores por defecto
 * derivados de la propia entidad — así toda página pública siempre puede
 * generar sus etiquetas SEO aunque nadie las haya configurado manualmente
 * (spec §7 "generar automáticamente").
 */
export function buildPublicSeoView(
  metadata: SeoMetadataEntity | null,
  fallback: PublicSeoFallback,
  ogImageUrl: string | null,
): PublicSeoView {
  return {
    metaTitle: metadata?.metaTitle || fallback.title,
    metaDescription: metadata?.metaDescription || fallback.description,
    canonicalUrl: metadata?.canonicalUrl || fallback.url,
    robots: metadata?.robots ?? SeoRobotsDirective.INDEX_FOLLOW,
    ogTitle: metadata?.ogTitle || metadata?.metaTitle || fallback.title,
    ogDescription: metadata?.ogDescription || metadata?.metaDescription || fallback.description,
    ogImageUrl,
    twitterCard: metadata?.twitterCard ?? SeoTwitterCardType.SUMMARY_LARGE_IMAGE,
    structuredData: metadata?.structuredData ?? null,
  };
}
