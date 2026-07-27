export type ProductVariantStatus = 'ACTIVE' | 'ARCHIVED';

export interface ProductOptionValue {
  id: string;
  optionId: string;
  value: string;
  position: number;
}

export interface ProductOption {
  id: string;
  productId: string;
  name: string;
  position: number;
  values: ProductOptionValue[];
}

export interface CreateProductOptionInput {
  name: string;
  values: string[];
}

export interface UpdateProductOptionInput {
  name?: string;
  values?: string[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  weight: number | null;
  imageId: string | null;
  status: ProductVariantStatus;
  optionValueIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductVariantInput {
  sku: string;
  slug?: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  weight?: number;
  barcode?: string;
  imageId?: string;
  optionValueIds: string[];
}

export interface UpdateProductVariantInput {
  sku?: string;
  slug?: string;
  title?: string;
  price?: number;
  compareAtPrice?: number | null;
  weight?: number | null;
  barcode?: string | null;
  imageId?: string | null;
  status?: ProductVariantStatus;
}

export interface ListVariantsParams {
  page?: number;
  pageSize?: number;
  status?: ProductVariantStatus;
}

export interface GenerateVariantsInput {
  basePrice?: number;
}

export interface GenerateVariantsResult {
  created: number;
  skippedExisting: number;
}

export interface BulkUpdateVariantsInput {
  ids: string[];
  status?: ProductVariantStatus;
  price?: number;
  compareAtPrice?: number | null;
}
