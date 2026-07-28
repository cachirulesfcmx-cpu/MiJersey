import type { MediaUsageService } from '../../../media/application/services/media-usage.service';
import type { BrandEntity, BrandProps } from '../../domain/entities/brand.entity';

export type PublicBrandView = BrandProps & { logoUrl: string | null; coverUrl: string | null };

/** Resuelve `logoMediaId`/`coverMediaId` a URLs servibles para que el storefront no dependa de los endpoints administrativos de Media. */
export async function toPublicBrandView(
  brand: BrandEntity,
  mediaUsage: MediaUsageService,
): Promise<PublicBrandView> {
  const [logo, cover] = await Promise.all([
    brand.logoMediaId ? mediaUsage.resolveUrls(brand.logoMediaId) : null,
    brand.coverMediaId ? mediaUsage.resolveUrls(brand.coverMediaId) : null,
  ]);

  return {
    ...brand.toJSON(),
    logoUrl: logo?.thumbnailUrl ?? logo?.url ?? null,
    coverUrl: cover?.url ?? null,
  };
}
