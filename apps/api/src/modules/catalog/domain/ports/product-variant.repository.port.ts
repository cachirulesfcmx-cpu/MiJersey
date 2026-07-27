import type { ProductVariantEntity } from '../entities/product-variant.entity';
import type { ProductVariantStatus } from '../value-objects/product-enums';

export interface CreateVariantData {
  productId: string;
  sku: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  weight: number | null;
  barcode: string | null;
  imageId: string | null;
  optionValueIds: string[];
  combinationKey: string;
}

export interface UpdateVariantData {
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
  productId: string;
  status?: ProductVariantStatus[];
  page: number;
  pageSize: number;
}

export interface ListVariantsResult {
  items: ProductVariantEntity[];
  total: number;
}

export interface BulkUpdateVariantsData {
  status?: ProductVariantStatus;
  price?: number;
  compareAtPrice?: number | null;
}

export interface ProductVariantRepositoryPort {
  findById(id: string): Promise<ProductVariantEntity | null>;
  existsBySku(sku: string, excludeId?: string): Promise<boolean>;
  existsBySlug(slug: string, excludeId?: string): Promise<boolean>;
  create(data: CreateVariantData): Promise<ProductVariantEntity>;
  /** Inserta en lote (usado por la generación de combinaciones); devuelve cuántas se crearon. */
  createMany(items: CreateVariantData[]): Promise<number>;
  update(id: string, data: UpdateVariantData): Promise<ProductVariantEntity>;
  delete(id: string): Promise<void>;
  findMany(params: ListVariantsParams): Promise<ListVariantsResult>;
  findManyPublic(productId: string, page: number, pageSize: number): Promise<ListVariantsResult>;
  bulkUpdate(ids: string[], data: BulkUpdateVariantsData): Promise<void>;
  /** `combinationKey`s ya usados por el producto, para que el generador salte combinaciones existentes. */
  existingCombinationKeys(productId: string): Promise<Set<string>>;
}
