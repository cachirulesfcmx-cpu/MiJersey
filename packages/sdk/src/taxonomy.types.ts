import type { PublicSeoView } from './seo.types';

export type CategoryStatus = 'ACTIVE' | 'HIDDEN';
export type CollectionStatus = 'ACTIVE' | 'HIDDEN';
export type CollectionType = 'MANUAL' | 'SMART';
export type CollectionRuleField = 'NAME' | 'SKU' | 'TYPE' | 'STATUS';
export type CollectionRuleOperator = 'EQUALS' | 'CONTAINS';
export type CollectionRuleMatchType = 'ALL' | 'ANY';

export interface Category {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  status: CategoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

export interface PublicCategoryBreadcrumb {
  id: string;
  slug: string;
  name: string;
}

/** Respuesta de `GET /categories/:slug` — incluye la ruta de breadcrumbs y las etiquetas SEO ya resueltas. */
export interface PublicCategory extends Category {
  breadcrumbs: PublicCategoryBreadcrumb[];
  seo: PublicSeoView;
}

export interface CreateCategoryInput {
  slug?: string;
  name: string;
  description?: string;
  image?: string;
  parentId?: string;
}

export interface UpdateCategoryInput {
  slug?: string;
  name?: string;
  description?: string;
  image?: string;
  status?: CategoryStatus;
}

export interface CollectionRuleValue {
  field: CollectionRuleField;
  operator: CollectionRuleOperator;
  value: string;
}

export interface CollectionRule extends CollectionRuleValue {
  id: string;
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: CollectionType;
  status: CollectionStatus;
  matchType: CollectionRuleMatchType;
  rules: CollectionRule[];
  createdAt: string;
  updatedAt: string;
}

export interface CollectionProductSummary {
  id: string;
  sku: string;
  slug: string;
  name: string;
  type: string;
  status: string;
  visibility: string;
}

export interface CollectionWithProducts extends Collection {
  products: CollectionProductSummary[];
  total: number;
  page: number;
  pageSize: number;
  seo: PublicSeoView;
}

export interface CreateCollectionInput {
  slug?: string;
  name: string;
  description?: string;
  type: CollectionType;
  matchType?: CollectionRuleMatchType;
  rules?: CollectionRuleValue[];
}

export interface UpdateCollectionInput {
  slug?: string;
  name?: string;
  description?: string;
  status?: CollectionStatus;
}

export interface ListCollectionsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CollectionStatus;
  type?: CollectionType;
}

export interface ProductPageParams {
  page?: number;
  pageSize?: number;
}
