import { Inject, Injectable } from '@nestjs/common';

import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import type { HomeSectionEntity } from '../../domain/entities/home-section.entity';
import type {
  BrandLookupSummary,
  CategoryLookupSummary,
  CollectionLookupSummary,
  HomeLookupPort,
  ProductLookupSummary,
} from '../../domain/ports/home-lookup.port';
import {
  type BannerGridConfig,
  extractEntityRefs,
  extractMediaIds,
  type FeaturedBrandsConfig,
  type FeaturedCategoriesConfig,
  type FeaturedCollectionsConfig,
  type FeaturedProductsConfig,
  type HeroBannerConfig,
  type ImageTextConfig,
  type NewsletterConfig,
  type PromotionBannerConfig,
  type RichTextConfig,
  type VideoBannerConfig,
} from '../../domain/value-objects/home-section-config';
import { HomeSectionType } from '../../domain/value-objects/home-section-enums';
import { HOME_LOOKUP } from '../../home.constants';

export interface PublicHomeSectionView {
  id: string;
  type: HomeSectionType;
  title: string;
  configuration: Record<string, unknown>;
}

type ResolvedMedia = Map<string, { url: string; thumbnailUrl: string | null } | null>;

/** Resuelve `configuration` (IDs de MediaAsset y de otras entidades del catálogo) a datos ya servibles, para que el storefront no necesite llamadas adicionales. */
@Injectable()
export class HomeEnrichmentService {
  constructor(
    @Inject(HOME_LOOKUP) private readonly lookup: HomeLookupPort,
    private readonly mediaUsage: MediaUsageService,
  ) {}

  async enrich(sections: HomeSectionEntity[]): Promise<PublicHomeSectionView[]> {
    const mediaIds = new Set<string>();
    const productIds = new Set<string>();
    const categoryIds = new Set<string>();
    const collectionIds = new Set<string>();
    const brandIds = new Set<string>();

    for (const section of sections) {
      extractMediaIds(section.type, section.configuration).forEach((id) => mediaIds.add(id));
      const refs = extractEntityRefs(section.type, section.configuration);
      refs.productIds.forEach((id) => productIds.add(id));
      refs.categoryIds.forEach((id) => categoryIds.add(id));
      refs.collectionIds.forEach((id) => collectionIds.add(id));
      refs.brandIds.forEach((id) => brandIds.add(id));
    }

    const [products, categories, collections, brands] = await Promise.all([
      this.lookup.findProductsByIds([...productIds]),
      this.lookup.findCategoriesByIds([...categoryIds]),
      this.lookup.findCollectionsByIds([...collectionIds]),
      this.lookup.findBrandsByIds([...brandIds]),
    ]);

    products.forEach((p) => p.imageMediaId && mediaIds.add(p.imageMediaId));
    brands.forEach((b) => b.logoMediaId && mediaIds.add(b.logoMediaId));

    const media = await this.resolveMedia([...mediaIds]);
    const productMap = new Map(products.map((p) => [p.id, p]));
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const collectionMap = new Map(collections.map((c) => [c.id, c]));
    const brandMap = new Map(brands.map((b) => [b.id, b]));

    return sections.map((section) =>
      this.buildPublicView(section, media, productMap, categoryMap, collectionMap, brandMap),
    );
  }

  private async resolveMedia(ids: string[]): Promise<ResolvedMedia> {
    const entries = await Promise.all(
      ids.map(async (id) => [id, await this.mediaUsage.resolveUrls(id)] as const),
    );
    return new Map(entries);
  }

  private buildPublicView(
    section: HomeSectionEntity,
    media: ResolvedMedia,
    productMap: Map<string, ProductLookupSummary>,
    categoryMap: Map<string, CategoryLookupSummary>,
    collectionMap: Map<string, CollectionLookupSummary>,
    brandMap: Map<string, BrandLookupSummary>,
  ): PublicHomeSectionView {
    const url = (id: string | null | undefined): string | null =>
      id ? (media.get(id)?.url ?? null) : null;
    const c = section.configuration;
    let configuration: Record<string, unknown>;

    switch (section.type) {
      case HomeSectionType.HERO_BANNER: {
        const cfg = c as unknown as HeroBannerConfig;
        configuration = {
          imageUrl: url(cfg.imageMediaId),
          mobileImageUrl: url(cfg.mobileImageMediaId),
          headline: cfg.headline,
          subheadline: cfg.subheadline ?? null,
          ctaLabel: cfg.ctaLabel ?? null,
          ctaUrl: cfg.ctaUrl ?? null,
        };
        break;
      }
      case HomeSectionType.BANNER_GRID: {
        const cfg = c as unknown as BannerGridConfig;
        configuration = {
          banners: cfg.banners.map((b) => ({
            imageUrl: url(b.imageMediaId),
            title: b.title ?? null,
            linkUrl: b.linkUrl ?? null,
          })),
        };
        break;
      }
      case HomeSectionType.FEATURED_PRODUCTS: {
        const cfg = c as unknown as FeaturedProductsConfig;
        configuration = {
          heading: cfg.heading ?? null,
          items: cfg.productIds
            .map((id) => productMap.get(id))
            .filter((p): p is ProductLookupSummary => p !== undefined)
            .map((p) => ({
              id: p.id,
              slug: p.slug,
              name: p.name,
              imageUrl: url(p.imageMediaId),
              fromPrice: p.fromPrice,
              compareAtPrice: p.compareAtPrice,
              rating: p.rating,
              reviewCount: p.reviewCount,
              defaultVariantId: p.defaultVariantId,
            })),
        };
        break;
      }
      case HomeSectionType.FEATURED_CATEGORIES: {
        const cfg = c as unknown as FeaturedCategoriesConfig;
        configuration = {
          heading: cfg.heading ?? null,
          items: cfg.categoryIds
            .map((id) => categoryMap.get(id))
            .filter((item): item is CategoryLookupSummary => item !== undefined)
            .map((item) => ({
              id: item.id,
              slug: item.slug,
              name: item.name,
              imageUrl: item.imageUrl,
            })),
        };
        break;
      }
      case HomeSectionType.FEATURED_COLLECTIONS: {
        const cfg = c as unknown as FeaturedCollectionsConfig;
        configuration = {
          heading: cfg.heading ?? null,
          items: cfg.collectionIds
            .map((id) => collectionMap.get(id))
            .filter((item): item is CollectionLookupSummary => item !== undefined)
            .map((item) => ({ id: item.id, slug: item.slug, name: item.name, imageUrl: null })),
        };
        break;
      }
      case HomeSectionType.FEATURED_BRANDS: {
        const cfg = c as unknown as FeaturedBrandsConfig;
        configuration = {
          heading: cfg.heading ?? null,
          items: cfg.brandIds
            .map((id) => brandMap.get(id))
            .filter((item): item is BrandLookupSummary => item !== undefined)
            .map((item) => ({
              id: item.id,
              slug: item.slug,
              name: item.name,
              imageUrl: url(item.logoMediaId),
            })),
        };
        break;
      }
      case HomeSectionType.PROMOTION_BANNER: {
        const cfg = c as unknown as PromotionBannerConfig;
        configuration = {
          imageUrl: url(cfg.imageMediaId),
          headline: cfg.headline ?? null,
          ctaLabel: cfg.ctaLabel ?? null,
          ctaUrl: cfg.ctaUrl ?? null,
          backgroundColor: cfg.backgroundColor ?? null,
        };
        break;
      }
      case HomeSectionType.RICH_TEXT: {
        const cfg = c as unknown as RichTextConfig;
        configuration = { html: cfg.html };
        break;
      }
      case HomeSectionType.IMAGE_TEXT: {
        const cfg = c as unknown as ImageTextConfig;
        configuration = {
          imageUrl: url(cfg.imageMediaId),
          title: cfg.title ?? null,
          body: cfg.body ?? null,
          ctaLabel: cfg.ctaLabel ?? null,
          ctaUrl: cfg.ctaUrl ?? null,
          imagePosition: cfg.imagePosition ?? 'left',
        };
        break;
      }
      case HomeSectionType.VIDEO_BANNER: {
        const cfg = c as unknown as VideoBannerConfig;
        configuration = {
          videoUrl: cfg.videoUrl,
          posterImageUrl: url(cfg.posterImageMediaId),
          headline: cfg.headline ?? null,
        };
        break;
      }
      case HomeSectionType.NEWSLETTER: {
        const cfg = c as unknown as NewsletterConfig;
        configuration = { headline: cfg.headline ?? null, subheadline: cfg.subheadline ?? null };
        break;
      }
      default:
        configuration = {};
    }

    return { id: section.id, type: section.type, title: section.title, configuration };
  }
}
