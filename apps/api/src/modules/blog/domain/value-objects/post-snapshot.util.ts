import type { PostEntity } from '../entities/post.entity';
import type { PostSnapshot } from '../entities/post-version.entity';

/** Convierte el estado actual de un artículo en el JSON completo que respalda un `PostVersion` — mismo criterio que `toPageSnapshot` (026). */
export function toPostSnapshot(post: PostEntity): PostSnapshot {
  const json = post.toJSON();
  return {
    title: json.title,
    slug: json.slug,
    status: json.status,
    excerpt: json.excerpt,
    content: json.content,
    featuredImage: json.featuredImage,
    seoTitle: json.seoTitle,
    seoDescription: json.seoDescription,
    categoryIds: json.categories.map((category) => category.id),
    tagIds: json.tags.map((tag) => tag.id),
  };
}
