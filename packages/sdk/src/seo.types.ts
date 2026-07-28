export type SeoEntityType = 'PRODUCT' | 'CATEGORY' | 'COLLECTION' | 'BRAND';
export type SeoRobotsDirective =
  'INDEX_FOLLOW' | 'NOINDEX_FOLLOW' | 'INDEX_NOFOLLOW' | 'NOINDEX_NOFOLLOW';
export type SeoTwitterCardType = 'SUMMARY' | 'SUMMARY_LARGE_IMAGE';

export interface SeoMetadata {
  id: string;
  entityType: SeoEntityType;
  entityId: string;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  robots: SeoRobotsDirective;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageMediaId: string | null;
  twitterCard: SeoTwitterCardType;
  structuredData: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertSeoMetadataInput {
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

export interface Redirect {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  createdAt: string;
}

export interface CreateRedirectInput {
  fromPath: string;
  toPath: string;
  statusCode?: number;
}

export interface ListRedirectsParams {
  page?: number;
  pageSize?: number;
}

export interface ResolvedRedirect {
  toPath: string;
  statusCode: number;
}

/** Etiquetas SEO ya resueltas que la API adjunta a cada vista pública (producto/categoría/colección/marca). */
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
