import type { CategoryEntity } from '../entities/category.entity';
import type { CategoryStatus } from '../value-objects/taxonomy-enums';

export interface CreateCategoryData {
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
}

export interface UpdateCategoryData {
  slug?: string;
  name?: string;
  description?: string | null;
  image?: string | null;
  status?: CategoryStatus;
}

export interface CategoryRepositoryPort {
  findById(id: string): Promise<CategoryEntity | null>;
  findBySlug(slug: string): Promise<CategoryEntity | null>;
  existsBySlug(slug: string): Promise<boolean>;
  /** Todas las categorías (cualquier estado), usado para construir el árbol admin. */
  findAll(): Promise<CategoryEntity[]>;
  /** Solo `ACTIVE`, usado para el árbol público. */
  findPublicAll(): Promise<CategoryEntity[]>;
  create(data: CreateCategoryData): Promise<CategoryEntity>;
  update(id: string, data: UpdateCategoryData): Promise<CategoryEntity>;
  move(id: string, parentId: string | null): Promise<CategoryEntity>;
  /** Fija `sortOrder` según la posición en `orderedIds` (deben ser hermanas de `parentId`). */
  reorder(parentId: string | null, orderedIds: string[]): Promise<void>;
  delete(id: string): Promise<void>;
  hasChildren(id: string): Promise<boolean>;
  assignProducts(categoryId: string, productIds: string[]): Promise<void>;
  removeProduct(categoryId: string, productId: string): Promise<void>;
  listProductIds(categoryId: string): Promise<string[]>;
}
