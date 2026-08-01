import { Inject, Injectable } from '@nestjs/common';

import { BLOG_CATEGORY_REPOSITORY } from '../../blog.constants';
import type { BlogCategoryEntity } from '../../domain/entities/blog-category.entity';
import type { BlogCategoryRepositoryPort } from '../../domain/ports/blog-category.repository.port';

@Injectable()
export class ListBlogCategoriesUseCase {
  constructor(
    @Inject(BLOG_CATEGORY_REPOSITORY) private readonly categories: BlogCategoryRepositoryPort,
  ) {}

  async execute(): Promise<BlogCategoryEntity[]> {
    return this.categories.findAll();
  }
}
