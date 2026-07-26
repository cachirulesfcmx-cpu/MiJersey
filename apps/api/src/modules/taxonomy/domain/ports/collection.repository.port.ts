import type { CollectionEntity } from '../entities/collection.entity';
import type {
  CollectionRuleField,
  CollectionRuleMatchType,
  CollectionRuleOperator,
  CollectionStatus,
  CollectionType,
} from '../value-objects/taxonomy-enums';

export interface CreateCollectionData {
  slug: string;
  name: string;
  description: string | null;
  type: CollectionType;
  matchType: CollectionRuleMatchType;
}

export interface UpdateCollectionData {
  slug?: string;
  name?: string;
  description?: string | null;
  status?: CollectionStatus;
}

export interface CollectionRuleInput {
  field: CollectionRuleField;
  operator: CollectionRuleOperator;
  value: string;
}

export interface ListCollectionsFilter {
  search?: string;
  status?: CollectionStatus[];
  type?: CollectionType[];
}

export interface ListCollectionsParams {
  filter?: ListCollectionsFilter;
  page: number;
  pageSize: number;
}

export interface ListCollectionsResult {
  items: CollectionEntity[];
  total: number;
}

export interface CollectionRepositoryPort {
  findById(id: string): Promise<CollectionEntity | null>;
  findBySlug(slug: string): Promise<CollectionEntity | null>;
  existsBySlug(slug: string): Promise<boolean>;
  create(data: CreateCollectionData): Promise<CollectionEntity>;
  update(id: string, data: UpdateCollectionData): Promise<CollectionEntity>;
  delete(id: string): Promise<void>;
  findMany(params: ListCollectionsParams): Promise<ListCollectionsResult>;
  findManyPublic(params: {
    search?: string;
    page: number;
    pageSize: number;
  }): Promise<ListCollectionsResult>;
  replaceRules(
    collectionId: string,
    matchType: CollectionRuleMatchType,
    rules: CollectionRuleInput[],
  ): Promise<void>;
  addProducts(collectionId: string, productIds: string[]): Promise<void>;
  removeProduct(collectionId: string, productId: string): Promise<void>;
  /** Solo aplica a colecciones MANUAL; fija `sortOrder` según la posición en la lista. */
  reorderProducts(collectionId: string, orderedProductIds: string[]): Promise<void>;
  /** IDs de producto de una colección MANUAL, ordenados por `sortOrder`. */
  listManualProductIds(collectionId: string): Promise<string[]>;
}
