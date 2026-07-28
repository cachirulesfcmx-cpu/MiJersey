export type BrandStatus = 'ACTIVE' | 'ARCHIVED';

export interface Brand {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  logoMediaId: string | null;
  coverMediaId: string | null;
  website: string | null;
  country: string | null;
  status: BrandStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/** Respuesta de los endpoints públicos: incluye las URLs de logo/cover ya resueltas por la API. */
export interface PublicBrand extends Brand {
  logoUrl: string | null;
  coverUrl: string | null;
}

export interface BrandProductSummary {
  id: string;
  sku: string;
  slug: string;
  name: string;
  status: string;
  visibility: string;
  createdAt: string;
}

export type BrandProductSortBy = 'name' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface CreateBrandInput {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  logoMediaId?: string;
  coverMediaId?: string;
  website?: string;
  country?: string;
}

export interface UpdateBrandInput {
  name?: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  logoMediaId?: string | null;
  coverMediaId?: string | null;
  website?: string | null;
  country?: string | null;
  status?: BrandStatus;
}

export interface ListBrandsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: BrandStatus;
}

export interface ListBrandProductsParams {
  page?: number;
  pageSize?: number;
  sortBy?: BrandProductSortBy;
  sortDir?: SortDirection;
}
