import { Inject, Injectable } from '@nestjs/common';

import { BLOG_TAG_REPOSITORY } from '../../blog.constants';
import type { BlogTagEntity } from '../../domain/entities/blog-tag.entity';
import {
  BlogTagNotFoundError,
  BlogTagSlugAlreadyExistsError,
} from '../../domain/errors/blog.errors';
import type {
  BlogTagRepositoryPort,
  UpdateBlogTagData,
} from '../../domain/ports/blog-tag.repository.port';

export interface UpdateBlogTagInput extends UpdateBlogTagData {
  id: string;
}

@Injectable()
export class UpdateBlogTagUseCase {
  constructor(@Inject(BLOG_TAG_REPOSITORY) private readonly tags: BlogTagRepositoryPort) {}

  async execute(input: UpdateBlogTagInput): Promise<BlogTagEntity> {
    const existing = await this.tags.findById(input.id);
    if (!existing) throw new BlogTagNotFoundError();

    if (input.slug && input.slug !== existing.slug) {
      const conflict = await this.tags.findBySlug(input.slug);
      if (conflict) throw new BlogTagSlugAlreadyExistsError();
    }

    const { id, ...data } = input;
    return this.tags.update(id, data);
  }
}
