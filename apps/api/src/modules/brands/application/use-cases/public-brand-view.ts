import type { MediaUsageService } from '../../../media/application/services/media-usage.service';
import { GetSeoMetadataUseCase } from '../../../seo/application/use-cases/get-seo-metadata.use-case';
import {
  buildPublicSeoView,
  type PublicSeoView,
} from '../../../seo/domain/value-objects/public-seo-view';
import { SeoEntityType } from '../../../seo/domain/value-objects/seo-enums';
import type { BrandEntity, BrandProps } from '../../domain/entities/brand.entity';

export type PublicBrandView = BrandProps & {
  logoUrl: string | null;
  coverUrl: string | null;
  seo: PublicSeoView;
};

export interface PublicBrandViewDeps {
  mediaUsage: MediaUsageService;
  seoMetadata: GetSeoMetadataUseCase;
  publicWebUrl: string;
}

/** Resuelve `logoMediaId`/`coverMediaId` a URLs servibles y adjunta las etiquetas SEO ya resueltas, para que el storefront no dependa de los endpoints administrativos de Media ni de SEO. */
export async function toPublicBrandView(
  brand: BrandEntity,
  deps: PublicBrandViewDeps,
): Promise<PublicBrandView> {
  const [logo, cover, seoMetadata] = await Promise.all([
    brand.logoMediaId ? deps.mediaUsage.resolveUrls(brand.logoMediaId) : null,
    brand.coverMediaId ? deps.mediaUsage.resolveUrls(brand.coverMediaId) : null,
    deps.seoMetadata.execute(SeoEntityType.BRAND, brand.id),
  ]);

  const ogImageMediaId = seoMetadata?.ogImageMediaId ?? brand.logoMediaId;
  const ogImage = ogImageMediaId
    ? ogImageMediaId === brand.logoMediaId
      ? logo
      : await deps.mediaUsage.resolveUrls(ogImageMediaId)
    : null;

  const seo = buildPublicSeoView(
    seoMetadata,
    {
      title: brand.name,
      description: brand.shortDescription ?? brand.description,
      url: `${deps.publicWebUrl.replace(/\/$/, '')}/brands/${brand.slug}`,
    },
    ogImage?.url ?? cover?.url ?? null,
  );

  return {
    ...brand.toJSON(),
    logoUrl: logo?.thumbnailUrl ?? logo?.url ?? null,
    coverUrl: cover?.url ?? null,
    seo,
  };
}
