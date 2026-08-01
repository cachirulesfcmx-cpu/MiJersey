import { Inject, Injectable } from '@nestjs/common';

import { BLOG_CATEGORY_REPOSITORY } from '../../blog.constants';
import type { BlogCategoryEntity } from '../../domain/entities/blog-category.entity';
import { BlogCategorySlugAlreadyExistsError } from '../../domain/errors/blog.errors';
import type {
  BlogCategoryRepositoryPort,
  CreateBlogCategoryData,
} from '../../domain/ports/blog-category.repository.port';

@Injectable()
export class CreateBlogCategoryUseCase {
  constructor(
    @Inject(BLOG_CATEGORY_REPOSITORY) private readonly categories: BlogCategoryRepositoryPort,
  ) {}

  async execute(data: CreateBlogCategoryData): Promise<BlogCategoryEntity> {
    const existing = await this.categories.findBySlug(data.slug);
    if (existing) throw new BlogCategorySlugAlreadyExistsError();

    return this.categories.create(data);
  }
}
