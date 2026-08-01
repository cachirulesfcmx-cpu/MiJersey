import { Inject, Injectable } from '@nestjs/common';

import { BLOG_TAG_REPOSITORY } from '../../blog.constants';
import type { BlogTagEntity } from '../../domain/entities/blog-tag.entity';
import type { BlogTagRepositoryPort } from '../../domain/ports/blog-tag.repository.port';

@Injectable()
export class ListBlogTagsUseCase {
  constructor(@Inject(BLOG_TAG_REPOSITORY) private readonly tags: BlogTagRepositoryPort) {}

  async execute(): Promise<BlogTagEntity[]> {
    return this.tags.findAll();
  }
}
