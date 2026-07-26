import { Inject, Injectable } from '@nestjs/common';

import type { CategoryEntity } from '../../domain/entities/category.entity';
import { CategoryNotFoundError } from '../../domain/errors/taxonomy.errors';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { CATEGORY_REPOSITORY } from '../../taxonomy.constants';

/** Ruta completa desde la raíz hasta la categoría (para breadcrumbs), raíz primero. */
@Injectable()
export class GetCategoryPathUseCase {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort) {}

  async execute(id: string): Promise<CategoryEntity[]> {
    const path: CategoryEntity[] = [];
    let currentId: string | null = id;

    while (currentId !== null) {
      const current: CategoryEntity | null = await this.categories.findById(currentId);
      if (!current) {
        if (path.length === 0) throw new CategoryNotFoundError();
        break;
      }
      path.unshift(current);
      currentId = current.parentId;
    }

    return path;
  }
}
