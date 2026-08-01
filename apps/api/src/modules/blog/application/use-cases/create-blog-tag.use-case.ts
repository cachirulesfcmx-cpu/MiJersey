import { Inject, Injectable } from '@nestjs/common';

import { BLOG_TAG_REPOSITORY } from '../../blog.constants';
import type { BlogTagEntity } from '../../domain/entities/blog-tag.entity';
import { BlogTagSlugAlreadyExistsError } from '../../domain/errors/blog.errors';
import type {
  BlogTagRepositoryPort,
  CreateBlogTagData,
} from '../../domain/ports/blog-tag.repository.port';

@Injectable()
export class CreateBlogTagUseCase {
  constructor(@Inject(BLOG_TAG_REPOSITORY) private readonly tags: BlogTagRepositoryPort) {}

  async execute(data: CreateBlogTagData): Promise<BlogTagEntity> {
    const existing = await this.tags.findBySlug(data.slug);
    if (existing) throw new BlogTagSlugAlreadyExistsError();

    return this.tags.create(data);
  }
}
