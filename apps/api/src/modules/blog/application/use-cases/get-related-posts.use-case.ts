import { Inject, Injectable } from '@nestjs/common';

import { POST_REPOSITORY, RELATED_POSTS_LIMIT } from '../../blog.constants';
import type { PostEntity } from '../../domain/entities/post.entity';
import { PostNotFoundError } from '../../domain/errors/blog.errors';
import type { PostRepositoryPort } from '../../domain/ports/post.repository.port';
import { PostStatus } from '../../domain/value-objects/post-enums';

/** "Generar contenido relacionado por categorías y etiquetas" (spec §4). El repositorio trae candidatos que comparten al menos una categoría o etiqueta; aquí se ordenan por número de coincidencias (categorías + etiquetas compartidas) y, en empate, por fecha de publicación más reciente — sin motor de recomendación, solo una relevancia simple y determinista. */
@Injectable()
export class GetRelatedPostsUseCase {
  constructor(@Inject(POST_REPOSITORY) private readonly posts: PostRepositoryPort) {}

  async execute(slug: string): Promise<PostEntity[]> {
    const post = await this.posts.findBySlug(slug);
    if (!post || post.status !== PostStatus.PUBLISHED) throw new PostNotFoundError();

    const categoryIds = post.categories.map((category) => category.id);
    const tagIds = post.tags.map((tag) => tag.id);
    if (categoryIds.length === 0 && tagIds.length === 0) return [];

    const candidates = await this.posts.findPublishedCandidatesForRelated(
      post.id,
      categoryIds,
      tagIds,
    );

    const scored = candidates.map((candidate) => {
      const sharedCategories = candidate.categories.filter((category) =>
        categoryIds.includes(category.id),
      ).length;
      const sharedTags = candidate.tags.filter((tag) => tagIds.includes(tag.id)).length;
      return { candidate, score: sharedCategories + sharedTags };
    });

    const relevant = scored.filter((entry) => entry.score > 0);

    relevant.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aTime = a.candidate.publishedAt?.getTime() ?? 0;
      const bTime = b.candidate.publishedAt?.getTime() ?? 0;
      return bTime - aTime;
    });

    return relevant.slice(0, RELATED_POSTS_LIMIT).map((entry) => entry.candidate);
  }
}
