import type { ProductAttributeView } from './attribute.types';
import type { PublicSeoView } from './seo.types';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type ProductVisibility = 'PUBLIC' | 'HIDDEN';
export type ProductType = 'PHYSICAL' | 'DIGITAL';

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  status: ProductStatus;
  visibility: ProductVisibility;
  type: ProductType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  sku: string;
  slug?: string;
  name: string;
  shortDescription?: string;
  description?: string;
  type?: ProductType;
  visibility?: ProductVisibility;
}

export interface UpdateProductInput {
  slug?: string;
  name?: string;
  shortDescription?: string;
  description?: string;
  type?: ProductType;
  visibility?: ProductVisibility;
}

export interface ListProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  type?: ProductType;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortDir?: 'asc' | 'desc';
}

export interface ListPublicProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ProductGalleryItem {
  mediaId: string;
  sortOrder: number;
  url: string | null;
  thumbnailUrl: string | null;
}

export interface SetProductGalleryInput {
  mediaIds: string[];
}

export interface PublicProductOptionValue {
  id: string;
  value: string;
  position: number;
}

export interface PublicProductOption {
  id: string;
  name: string;
  position: number;
  values: PublicProductOptionValue[];
}

export interface PublicProductVariant {
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

export interface PublicProductBrandSummary {
  id: string;
  slug: string;
  name: string;
  logoMediaId: string | null;
  logoUrl: string | null;
}

export interface PublicProductCategorySummary {
  id: string;
  slug: string;
  name: string;
}

/** Respuesta de `GET /products/:slug` (015): producto base enriquecido con marca, categorías, galería, opciones+variantes (con disponibilidad), especificaciones y SEO ya resueltos por la API. */
export interface PublicProduct extends Product {
  brand: PublicProductBrandSummary | null;
  categories: PublicProductCategorySummary[];
  galleryUrls: string[];
  options: PublicProductOption[];
  variants: PublicProductVariant[];
  specifications: ProductAttributeView[];
  seo: PublicSeoView;
}
