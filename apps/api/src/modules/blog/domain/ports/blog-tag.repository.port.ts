import type { BlogTagEntity } from '../entities/blog-tag.entity';

export interface CreateBlogTagData {
  name: string;
  slug: string;
}

export type UpdateBlogTagData = Partial<CreateBlogTagData>;

export interface BlogTagRepositoryPort {
  findById(id: string): Promise<BlogTagEntity | null>;
  findBySlug(slug: string): Promise<BlogTagEntity | null>;
  findByIds(ids: string[]): Promise<BlogTagEntity[]>;
  findAll(): Promise<BlogTagEntity[]>;
  create(data: CreateBlogTagData): Promise<BlogTagEntity>;
  update(id: string, data: UpdateBlogTagData): Promise<BlogTagEntity>;
  delete(id: string): Promise<void>;
}
