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
