import { GetSeoMetadataUseCase } from '../../../seo/application/use-cases/get-seo-metadata.use-case';
import {
  buildPublicSeoView,
  type PublicSeoView,
} from '../../../seo/domain/value-objects/public-seo-view';
import { SeoEntityType } from '../../../seo/domain/value-objects/seo-enums';
import type { CategoryEntity, CategoryProps } from '../../domain/entities/category.entity';

export interface PublicCategoryBreadcrumb {
  id: string;
  slug: string;
  name: string;
}

export type PublicCategoryView = CategoryProps & {
  breadcrumbs: PublicCategoryBreadcrumb[];
  seo: PublicSeoView;
};

export interface PublicCategoryViewDeps {
  seoMetadata: GetSeoMetadataUseCase;
  publicWebUrl: string;
  breadcrumbs: PublicCategoryBreadcrumb[];
}

/** `image` ya es una URL directa (no un id de MediaAsset), a diferencia de Brand — no requiere MediaUsageService. */
export async function toPublicCategoryView(
  category: CategoryEntity,
  deps: PublicCategoryViewDeps,
): Promise<PublicCategoryView> {
  const seoMetadata = await deps.seoMetadata.execute(SeoEntityType.CATEGORY, category.id);

  const seo = buildPublicSeoView(
    seoMetadata,
    {
      title: category.name,
      description: category.description,
      url: `${deps.publicWebUrl.replace(/\/$/, '')}/categories/${category.slug}`,
    },
    category.image,
  );

  return { ...category.toJSON(), breadcrumbs: deps.breadcrumbs, seo };
}
