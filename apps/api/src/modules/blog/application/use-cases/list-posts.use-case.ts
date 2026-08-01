import type { PaginatedResult } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import { POST_REPOSITORY } from '../../blog.constants';
import type { PostEntity } from '../../domain/entities/post.entity';
import type { ListPostsParams, PostRepositoryPort } from '../../domain/ports/post.repository.port';

@Injectable()
export class ListPostsUseCase {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: PostRepositoryPort) {}

  async execute(params: ListPostsParams): Promise<PaginatedResult<PostEntity>> {
    return this.posts.findMany(params);
  }
}
