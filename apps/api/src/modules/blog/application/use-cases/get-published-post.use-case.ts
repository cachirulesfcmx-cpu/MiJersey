import { Inject, Injectable } from '@nestjs/common';

import { POST_REPOSITORY } from '../../blog.constants';
import type { PostProps } from '../../domain/entities/post.entity';
import { PostNotFoundError } from '../../domain/errors/blog.errors';
import type { PostRepositoryPort } from '../../domain/ports/post.repository.port';
import { PostStatus } from '../../domain/value-objects/post-enums';
import { BlogCacheService } from '../services/blog-cache.service';

export type PublishedPostView = PostProps;

/** Lectura pública cacheada de un artículo por slug (spec §8 "caché de publicaciones"). Antes de resolver, promueve cualquier `SCHEDULED` vencido a `PUBLISHED` (persistiendo el cambio) — mismo criterio "derivar y persistir en la lectura" que `GetPublishedPageUseCase` (026). `DRAFT`/`ARCHIVED`, y `SCHEDULED` aún futuro, responden como "no encontrado" sin filtrar su estado interno. */
@Injectable()
export class GetPublishedPostUseCase {
  constructor(
    @Inject(POST_REPOSITORY) private readonly posts: PostRepositoryPort,
    private readonly cache: BlogCacheService,
  ) {}

  async execute(slug: string): Promise<PublishedPostView> {
    const cached = await this.cache.getPost(slug);
    if (cached) return JSON.parse(cached) as PublishedPostView;

    const promotedSlugs = await this.posts.promoteDuePosts(new Date());
    await Promise.all(promotedSlugs.map((promoted) => this.cache.invalidatePost(promoted)));

    const post = await this.posts.findBySlug(slug);
    if (!post || post.status !== PostStatus.PUBLISHED) throw new PostNotFoundError();

    const view = post.toJSON();
    await this.cache.setPost(slug, JSON.stringify(view));
    return view;
  }
}
