import { Inject, Injectable } from '@nestjs/common';

import { BLOG_CATEGORY_REPOSITORY } from '../../blog.constants';
import type { BlogCategoryEntity } from '../../domain/entities/blog-category.entity';
import {
  BlogCategoryNotFoundError,
  BlogCategorySlugAlreadyExistsError,
} from '../../domain/errors/blog.errors';
import type {
  BlogCategoryRepositoryPort,
  UpdateBlogCategoryData,
} from '../../domain/ports/blog-category.repository.port';

export interface UpdateBlogCategoryInput extends UpdateBlogCategoryData {
  id: string;
}

@Injectable()
export class UpdateBlogCategoryUseCase {
  constructor(
    @Inject(BLOG_CATEGORY_REPOSITORY) private readonly categories: BlogCategoryRepositoryPort,
  ) {}

  async execute(input: UpdateBlogCategoryInput): Promise<BlogCategoryEntity> {
    const existing = await this.categories.findById(input.id);
    if (!existing) throw new BlogCategoryNotFoundError();

    if (input.slug && input.slug !== existing.slug) {
      const conflict = await this.categories.findBySlug(input.slug);
      if (conflict) throw new BlogCategorySlugAlreadyExistsError();
    }

    const { id, ...data } = input;
    return this.categories.update(id, data);
  }
}
