import type { BrandEntity } from '../entities/brand.entity';
import type { BrandStatus } from '../value-objects/brand-status';

export interface CreateBrandData {
  slug: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  logoMediaId: string | null;
  coverMediaId: string | null;
  website: string | null;
  country: string | null;
}

export interface UpdateBrandData {
  slug?: string;
  name?: string;
  description?: string | null;
  shortDescription?: string | null;
  logoMediaId?: string | null;
  coverMediaId?: string | null;
  website?: string | null;
  country?: string | null;
  status?: BrandStatus;
  sortOrder?: number;
}

export interface ListBrandsFilter {
  search?: string;
  status?: BrandStatus;
}

export interface ListBrandsParams {
  filter?: ListBrandsFilter;
  page: number;
  pageSize: number;
}

export interface ListBrandsResult {
  items: BrandEntity[];
  total: number;
}

export interface BrandRepositoryPort {
  findById(id: string): Promise<BrandEntity | null>;
  findBySlug(slug: string): Promise<BrandEntity | null>;
  existsBySlug(slug: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
  findMany(params: ListBrandsParams): Promise<ListBrandsResult>;
  findPublicBySlug(slug: string): Promise<BrandEntity | null>;
  findAllActive(): Promise<BrandEntity[]>;
  create(data: CreateBrandData): Promise<BrandEntity>;
  update(id: string, data: UpdateBrandData): Promise<BrandEntity>;
  reorder(orderedIds: string[]): Promise<void>;
  delete(id: string): Promise<void>;
}
