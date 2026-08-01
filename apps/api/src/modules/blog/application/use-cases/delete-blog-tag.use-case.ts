import { Inject, Injectable } from '@nestjs/common';

import { BLOG_TAG_REPOSITORY } from '../../blog.constants';
import { BlogTagNotFoundError } from '../../domain/errors/blog.errors';
import type { BlogTagRepositoryPort } from '../../domain/ports/blog-tag.repository.port';

@Injectable()
export class DeleteBlogTagUseCase {
  constructor(@Inject(BLOG_TAG_REPOSITORY) private readonly tags: BlogTagRepositoryPort) {}

  async execute(id: string): Promise<void> {
    const existing = await this.tags.findById(id);
    if (!existing) throw new BlogTagNotFoundError();

    await this.tags.delete(id);
  }
}
