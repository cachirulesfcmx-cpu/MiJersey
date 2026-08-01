import { Inject, Injectable } from '@nestjs/common';

import { BLOG_CATEGORY_REPOSITORY } from '../../blog.constants';
import { BlogCategoryNotFoundError } from '../../domain/errors/blog.errors';
import type { BlogCategoryRepositoryPort } from '../../domain/ports/blog-category.repository.port';

@Injectable()
export class DeleteBlogCategoryUseCase {
  constructor(
    @Inject(BLOG_CATEGORY_REPOSITORY) private readonly categories: BlogCategoryRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.categories.findById(id);
    if (!existing) throw new BlogCategoryNotFoundError();

    await this.categories.delete(id);
  }
}
