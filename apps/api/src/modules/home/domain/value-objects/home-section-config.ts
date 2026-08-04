import { HomeSectionType } from './home-section-enums';

export interface HeroBannerConfig {
  imageMediaId: string;
  mobileImageMediaId?: string;
  /** Video de fondo opcional (MediaAsset type=VIDEO) -- si está presente, el frontend lo reproduce en loop y usa imageMediaId como poster/fallback. */
  videoMediaId?: string;
  headline: string;
  subheadline?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface BannerGridItem {
  imageMediaId: string;
  title?: string;
  linkUrl?: string;
}

export interface BannerGridConfig {
  banners: BannerGridItem[];
}

export interface FeaturedProductsConfig {
  heading?: string;
  productIds: string[];
}

export interface FeaturedCategoriesConfig {
  heading?: string;
  categoryIds: string[];
}

export interface FeaturedCollectionsConfig {
  heading?: string;
  collectionIds: string[];
}

export interface FeaturedBrandsConfig {
  heading?: string;
  brandIds: string[];
}

export interface PromotionBannerConfig {
  imageMediaId: string;
  headline?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  backgroundColor?: string;
}

export interface RichTextConfig {
  html: string;
}

export interface ImageTextConfig {
  imageMediaId: string;
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  imagePosition?: 'left' | 'right';
}

export interface VideoBannerConfig {
  videoUrl: string;
  posterImageMediaId?: string;
  headline?: string;
}

export interface NewsletterConfig {
  headline?: string;
  subheadline?: string;
}

export type HomeSectionConfiguration = Record<string, unknown>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

/** Validación mínima de forma por tipo de bloque — no un esquema completo, solo lo suficiente para detectar configuraciones incompletas antes de guardarlas. */
export function validateHomeSectionConfig(
  type: HomeSectionType,
  configuration: HomeSectionConfiguration,
): string | null {
  switch (type) {
    case HomeSectionType.HERO_BANNER: {
      const c = configuration as Partial<HeroBannerConfig>;
      if (!isNonEmptyString(c.imageMediaId)) return 'imageMediaId es obligatorio';
      if (!isNonEmptyString(c.headline)) return 'headline es obligatorio';
      return null;
    }
    case HomeSectionType.BANNER_GRID: {
      const c = configuration as Partial<BannerGridConfig>;
      if (!Array.isArray(c.banners) || c.banners.length === 0) {
        return 'banners debe ser un arreglo con al menos un elemento';
      }
      if (c.banners.some((b) => !isNonEmptyString(b?.imageMediaId))) {
        return 'cada banner requiere imageMediaId';
      }
      return null;
    }
    case HomeSectionType.FEATURED_PRODUCTS: {
      const c = configuration as Partial<FeaturedProductsConfig>;
      if (!isStringArray(c.productIds) || c.productIds.length === 0) {
        return 'productIds debe ser un arreglo con al menos un id';
      }
      return null;
    }
    case HomeSectionType.FEATURED_CATEGORIES: {
      const c = configuration as Partial<FeaturedCategoriesConfig>;
      if (!isStringArray(c.categoryIds) || c.categoryIds.length === 0) {
        return 'categoryIds debe ser un arreglo con al menos un id';
      }
      return null;
    }
    case HomeSectionType.FEATURED_COLLECTIONS: {
      const c = configuration as Partial<FeaturedCollectionsConfig>;
      if (!isStringArray(c.collectionIds) || c.collectionIds.length === 0) {
        return 'collectionIds debe ser un arreglo con al menos un id';
      }
      return null;
    }
    case HomeSectionType.FEATURED_BRANDS: {
      const c = configuration as Partial<FeaturedBrandsConfig>;
      if (!isStringArray(c.brandIds) || c.brandIds.length === 0) {
        return 'brandIds debe ser un arreglo con al menos un id';
      }
      return null;
    }
    case HomeSectionType.PROMOTION_BANNER: {
      const c = configuration as Partial<PromotionBannerConfig>;
      if (!isNonEmptyString(c.imageMediaId)) return 'imageMediaId es obligatorio';
      return null;
    }
    case HomeSectionType.RICH_TEXT: {
      const c = configuration as Partial<RichTextConfig>;
      if (!isNonEmptyString(c.html)) return 'html es obligatorio';
      return null;
    }
    case HomeSectionType.IMAGE_TEXT: {
      const c = configuration as Partial<ImageTextConfig>;
      if (!isNonEmptyString(c.imageMediaId)) return 'imageMediaId es obligatorio';
      return null;
    }
    case HomeSectionType.VIDEO_BANNER: {
      const c = configuration as Partial<VideoBannerConfig>;
      if (!isNonEmptyString(c.videoUrl)) return 'videoUrl es obligatorio';
      return null;
    }
    case HomeSectionType.NEWSLETTER:
      return null;
    default:
      return null;
  }
}

/** IDs de MediaAsset embebidos en `configuration` — usado para registrar/liberar uso vía MediaUsageService (010). */
export function extractMediaIds(
  type: HomeSectionType,
  configuration: HomeSectionConfiguration,
): string[] {
  switch (type) {
    case HomeSectionType.HERO_BANNER: {
      const c = configuration as Partial<HeroBannerConfig>;
      return [c.imageMediaId, c.mobileImageMediaId, c.videoMediaId].filter(
        (id): id is string => !!id,
      );
    }
    case HomeSectionType.BANNER_GRID: {
      const c = configuration as Partial<BannerGridConfig>;
      return (c.banners ?? []).map((b) => b?.imageMediaId).filter((id): id is string => !!id);
    }
    case HomeSectionType.PROMOTION_BANNER: {
      const c = configuration as Partial<PromotionBannerConfig>;
      return c.imageMediaId ? [c.imageMediaId] : [];
    }
    case HomeSectionType.IMAGE_TEXT: {
      const c = configuration as Partial<ImageTextConfig>;
      return c.imageMediaId ? [c.imageMediaId] : [];
    }
    case HomeSectionType.VIDEO_BANNER: {
      const c = configuration as Partial<VideoBannerConfig>;
      return c.posterImageMediaId ? [c.posterImageMediaId] : [];
    }
    default:
      return [];
  }
}

export interface HomeSectionEntityRefs {
  productIds: string[];
  categoryIds: string[];
  collectionIds: string[];
  brandIds: string[];
}

/** IDs de otras entidades del catálogo referenciadas por `configuration` — usado para enriquecer la respuesta pública. */
export function extractEntityRefs(
  type: HomeSectionType,
  configuration: HomeSectionConfiguration,
): HomeSectionEntityRefs {
  const empty: HomeSectionEntityRefs = {
    productIds: [],
    categoryIds: [],
    collectionIds: [],
    brandIds: [],
  };
  switch (type) {
    case HomeSectionType.FEATURED_PRODUCTS:
      return {
        ...empty,
        productIds: (configuration as Partial<FeaturedProductsConfig>).productIds ?? [],
      };
    case HomeSectionType.FEATURED_CATEGORIES:
      return {
        ...empty,
        categoryIds: (configuration as Partial<FeaturedCategoriesConfig>).categoryIds ?? [],
      };
    case HomeSectionType.FEATURED_COLLECTIONS:
      return {
        ...empty,
        collectionIds: (configuration as Partial<FeaturedCollectionsConfig>).collectionIds ?? [],
      };
    case HomeSectionType.FEATURED_BRANDS:
      return {
        ...empty,
        brandIds: (configuration as Partial<FeaturedBrandsConfig>).brandIds ?? [],
      };
    default:
      return empty;
  }
}
