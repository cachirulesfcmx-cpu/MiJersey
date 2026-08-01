import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import { POST_REPOSITORY, POST_VERSION_REPOSITORY } from '../../blog.constants';
import type { PostVersionEntity } from '../../domain/entities/post-version.entity';
import { PostNotFoundError } from '../../domain/errors/blog.errors';
import type { PostRepositoryPort } from '../../domain/ports/post.repository.port';
import type { PostVersionRepositoryPort } from '../../domain/ports/post-version.repository.port';

export interface ListPostVersionsInput extends PaginationParams {
  postId: string;
}

@Injectable()
export class ListPostVersionsUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: PostRepositoryPort,
    @Inject(POST_VERSION_REPOSITORY) private readonly versions: PostVersionRepositoryPort,
  ) {}

  async execute(input: ListPostVersionsInput): Promise<PaginatedResult<PostVersionEntity>> {
    const post = await this.posts.findById(input.postId);
    if (!post) throw new PostNotFoundError();

    return this.versions.findMany(input.postId, { page: input.page, pageSize: input.pageSize });
  }
}
