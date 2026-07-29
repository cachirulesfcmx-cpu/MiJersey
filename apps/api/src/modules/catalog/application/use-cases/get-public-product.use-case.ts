import { Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import { ListProductAttributesUseCase } from '../../../attributes/application/use-cases/list-product-attributes.use-case';
import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import { GetSeoMetadataUseCase } from '../../../seo/application/use-cases/get-seo-metadata.use-case';
import { buildPublicSeoView } from '../../../seo/domain/value-objects/public-seo-view';
import { SeoEntityType } from '../../../seo/domain/value-objects/seo-enums';
import {
  INVENTORY_AVAILABILITY,
  MAX_PDP_VARIANTS,
  PRODUCT_DETAIL_LOOKUP,
  PRODUCT_MEDIA_REPOSITORY,
  PRODUCT_OPTION_REPOSITORY,
  PRODUCT_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
} from '../../catalog.constants';
import { ProductNotFoundError } from '../../domain/errors/catalog.errors';
import type { InventoryAvailabilityPort } from '../../domain/ports/inventory-availability.port';
import type { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import type { ProductDetailLookupPort } from '../../domain/ports/product-detail-lookup.port';
import type { ProductMediaRepositoryPort } from '../../domain/ports/product-media.repository.port';
import type { ProductOptionRepositoryPort } from '../../domain/ports/product-option.repository.port';
import type { ProductVariantRepositoryPort } from '../../domain/ports/product-variant.repository.port';
import { ProductStatus, ProductVisibility } from '../../domain/value-objects/product-enums';
import type {
  PublicBrandSummaryView,
  PublicOptionView,
  PublicProductView,
  PublicVariantView,
} from '../../domain/value-objects/public-product-view';

type ResolvedMedia = Map<string, { url: string; thumbnailUrl: string | null } | null>;

/** Igual que GetProductUseCase, pero enriquecido para la PDP pública (015): marca, categorías, galería, opciones+variantes con disponibilidad, especificaciones y SEO automático. */
@Injectable()
export class GetPublicProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepositoryPort,
    @Inject(PRODUCT_OPTION_REPOSITORY) private readonly options: ProductOptionRepositoryPort,
    @Inject(PRODUCT_VARIANT_REPOSITORY) private readonly variants: ProductVariantRepositoryPort,
    @Inject(PRODUCT_MEDIA_REPOSITORY) private readonly media: ProductMediaRepositoryPort,
    @Inject(PRODUCT_DETAIL_LOOKUP) private readonly lookup: ProductDetailLookupPort,
    @Inject(INVENTORY_AVAILABILITY) private readonly availability: InventoryAvailabilityPort,
    private readonly mediaUsage: MediaUsageService,
    private readonly seoMetadata: GetSeoMetadataUseCase,
    private readonly productAttributes: ListProductAttributesUseCase,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async execute(slug: string): Promise<PublicProductView> {
    const product = await this.products.findBySlug(slug);
    if (
      !product ||
      product.status !== ProductStatus.ACTIVE ||
      product.visibility !== ProductVisibility.PUBLIC
    ) {
      throw new ProductNotFoundError();
    }

    const [relations, galleryItems, options, variantsResult, specifications, seoMetadata] =
      await Promise.all([
        this.lookup.findProductRelations(product.id),
        this.media.list(product.id),
        this.options.findByProductId(product.id),
        this.variants.findManyPublic(product.id, 1, MAX_PDP_VARIANTS),
        this.productAttributes.execute(product.id),
        this.seoMetadata.execute(SeoEntityType.PRODUCT, product.id),
      ]);

    const [brandSummary, categories] = await Promise.all([
      relations.brandId ? this.lookup.findBrandSummary(relations.brandId) : null,
      this.lookup.findCategorySummaries(relations.categoryIds),
    ]);

    const activeVariants = variantsResult.items;
    const availabilityMap = await this.availability.getAvailability(
      activeVariants.map((variant) => variant.id),
    );

    const mediaIds = new Set<string>();
    galleryItems.forEach((item) => mediaIds.add(item.mediaId));
    activeVariants.forEach((variant) => variant.imageId && mediaIds.add(variant.imageId));
    if (brandSummary?.logoMediaId) mediaIds.add(brandSummary.logoMediaId);

    const resolvedMedia = await this.resolveMedia([...mediaIds]);

    const galleryUrls = galleryItems
      .map((item) => resolvedMedia.get(item.mediaId)?.url)
      .filter((url): url is string => !!url);

    const variantsView: PublicVariantView[] = activeVariants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      slug: variant.slug,
      title: variant.title,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      imageUrl: variant.imageId ? (resolvedMedia.get(variant.imageId)?.url ?? null) : null,
      optionValueIds: variant.optionValueIds,
      availableQuantity: availabilityMap.get(variant.id) ?? 0,
      inStock: (availabilityMap.get(variant.id) ?? 0) > 0,
    }));

    const optionsView: PublicOptionView[] = options.map((option) => ({
      id: option.id,
      name: option.name,
      position: option.position,
      values: option.values.map((value) => ({
        id: value.id,
        value: value.value,
        position: value.position,
      })),
    }));

    const brandView: PublicBrandSummaryView | null = brandSummary
      ? {
          ...brandSummary,
          logoUrl: brandSummary.logoMediaId
            ? (resolvedMedia.get(brandSummary.logoMediaId)?.url ?? null)
            : null,
        }
      : null;

    const primaryImageUrl =
      galleryUrls[0] ?? variantsView.find((variant) => variant.imageUrl)?.imageUrl ?? null;

    const seo = buildPublicSeoView(
      seoMetadata,
      {
        title: product.name,
        description: product.shortDescription ?? product.description,
        url: `${this.config.publicWebUrl.replace(/\/$/, '')}/products/${product.slug}`,
      },
      primaryImageUrl,
    );

    return {
      ...product.toJSON(),
      brand: brandView,
      categories,
      galleryUrls,
      options: optionsView,
      variants: variantsView,
      specifications,
      seo,
    };
  }

  private async resolveMedia(ids: string[]): Promise<ResolvedMedia> {
    const entries = await Promise.all(
      ids.map(async (id) => [id, await this.mediaUsage.resolveUrls(id)] as const),
    );
    return new Map(entries);
  }
}
