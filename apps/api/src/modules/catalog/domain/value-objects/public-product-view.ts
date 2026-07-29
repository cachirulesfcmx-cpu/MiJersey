import type { ProductAttributeView } from '../../../attributes/application/use-cases/list-product-attributes.use-case';
import type { PublicSeoView } from '../../../seo/domain/value-objects/public-seo-view';
import type { ProductProps } from '../entities/product.entity';
import type { BrandSummary, CategorySummary } from '../ports/product-detail-lookup.port';

export interface PublicVariantView {
  id: string;
  sku: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  optionValueIds: string[];
  availableQuantity: number;
  inStock: boolean;
}

export interface PublicOptionValueView {
  id: string;
  value: string;
  position: number;
}

export interface PublicOptionView {
  id: string;
  name: string;
  position: number;
  values: PublicOptionValueView[];
}

export type PublicBrandSummaryView = BrandSummary & { logoUrl: string | null };

export type PublicProductView = ProductProps & {
  brand: PublicBrandSummaryView | null;
  categories: CategorySummary[];
  galleryUrls: string[];
  options: PublicOptionView[];
  variants: PublicVariantView[];
  specifications: ProductAttributeView[];
  seo: PublicSeoView;
};
