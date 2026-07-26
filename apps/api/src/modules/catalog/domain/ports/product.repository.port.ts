import type { ProductEntity } from '../entities/product.entity';
import type { ProductStatus, ProductType, ProductVisibility } from '../value-objects/product-enums';

export interface CreateProductData {
  sku: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  type: ProductType;
  visibility: ProductVisibility;
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  shortDescription?: string | null;
  description?: string | null;
  visibility?: ProductVisibility;
  type?: ProductType;
}

export interface ListProductsFilter {
  search?: string;
  status?: ProductStatus[];
  visibility?: ProductVisibility[];
  type?: ProductType[];
  /** Restringe a lo que puede ver el storefront: ACTIVE + PUBLIC, sin importar `status`/`visibility`. */
  publicOnly?: boolean;
}

export type ProductSortField = 'name' | 'createdAt' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface ListProductsParams {
  filter?: ListProductsFilter;
  page: number;
  pageSize: number;
  sortBy?: ProductSortField;
  sortDir?: SortDirection;
}

export interface ListProductsResult {
  items: ProductEntity[];
  total: number;
}

export interface ProductRepositoryPort {
  findById(id: string): Promise<ProductEntity | null>;
  findBySlug(slug: string): Promise<ProductEntity | null>;
  existsBySku(sku: string): Promise<boolean>;
  existsBySlug(slug: string): Promise<boolean>;
  create(data: CreateProductData): Promise<ProductEntity>;
  update(id: string, data: UpdateProductData): Promise<ProductEntity>;
  updateStatus(id: string, status: ProductStatus): Promise<void>;
  bulkUpdateStatus(ids: string[], status: ProductStatus): Promise<void>;
  softDelete(id: string): Promise<void>;
  bulkSoftDelete(ids: string[]): Promise<void>;
  findMany(params: ListProductsParams): Promise<ListProductsResult>;
  count(): Promise<number>;
}
