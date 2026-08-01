import type { PaginatedResult } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import { POST_REPOSITORY } from '../../blog.constants';
import type { PostEntity } from '../../domain/entities/post.entity';
import type {
  ListPublishedPostsParams,
  PostRepositoryPort,
} from '../../domain/ports/post.repository.port';
import { BlogCacheService } from '../services/blog-cache.service';

/** Blog Home / Category Archive / Tag Archive (spec §6). No se cachea el listado en sí (a diferencia del detalle por slug) porque su clave dependería de página+filtros; sí promueve `SCHEDULED` vencidos antes de listar, mismo criterio que `GetPublishedPostUseCase`. */
@Injectable()
export class ListPublishedPostsUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: PostRepositoryPort,
    private readonly cache: BlogCacheService,
  ) {}

  async execute(params: ListPublishedPostsParams): Promise<PaginatedResult<PostEntity>> {
    const promotedSlugs = await this.posts.promoteDuePosts(new Date());
    await Promise.all(promotedSlugs.map((slug) => this.cache.invalidatePost(slug)));

    return this.posts.findManyPublished(params);
  }
}
