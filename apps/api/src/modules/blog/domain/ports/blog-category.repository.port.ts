import type { BlogCategoryEntity } from '../entities/blog-category.entity';

export interface CreateBlogCategoryData {
  name: string;
  slug: string;
}

export type UpdateBlogCategoryData = Partial<CreateBlogCategoryData>;

export interface BlogCategoryRepositoryPort {
  findById(id: string): Promise<BlogCategoryEntity | null>;
  findBySlug(slug: string): Promise<BlogCategoryEntity | null>;
  findByIds(ids: string[]): Promise<BlogCategoryEntity[]>;
  findAll(): Promise<BlogCategoryEntity[]>;
  create(data: CreateBlogCategoryData): Promise<BlogCategoryEntity>;
  update(id: string, data: UpdateBlogCategoryData): Promise<BlogCategoryEntity>;
  delete(id: string): Promise<void>;
}
