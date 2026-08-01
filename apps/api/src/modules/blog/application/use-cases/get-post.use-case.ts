import { Inject, Injectable } from '@nestjs/common';

import { POST_REPOSITORY } from '../../blog.constants';
import type { PostEntity } from '../../domain/entities/post.entity';
import { PostNotFoundError } from '../../domain/errors/blog.errors';
import type { PostRepositoryPort } from '../../domain/ports/post.repository.port';

@Injectable()
export class GetPostUseCase {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: PostRepositoryPort) {}

  async execute(id: string): Promise<PostEntity> {
    const post = await this.posts.findById(id);
    if (!post) throw new PostNotFoundError();
    return post;
  }
}
