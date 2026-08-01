import { BlogCategoryNotFoundError, BlogTagNotFoundError } from '../../domain/errors/blog.errors';
import type { BlogCategoryRepositoryPort } from '../../domain/ports/blog-category.repository.port';
import type { BlogTagRepositoryPort } from '../../domain/ports/blog-tag.repository.port';

/** Valida que las categorías/etiquetas asignadas a un artículo existan antes de escribir, para fallar con un error de dominio claro en vez de una violación de FK de Prisma. */
export async function assertTermsExist(
  categories: BlogCategoryRepositoryPort,
  tags: BlogTagRepositoryPort,
  categoryIds: string[],
  tagIds: string[],
): Promise<void> {
  if (categoryIds.length > 0) {
    const found = await categories.findByIds(categoryIds);
    if (found.length !== new Set(categoryIds).size) throw new BlogCategoryNotFoundError();
  }
  if (tagIds.length > 0) {
    const found = await tags.findByIds(tagIds);
    if (found.length !== new Set(tagIds).size) throw new BlogTagNotFoundError();
  }
}
