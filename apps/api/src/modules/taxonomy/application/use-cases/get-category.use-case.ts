import { Inject, Injectable } from '@nestjs/common';

import type { CategoryEntity } from '../../domain/entities/category.entity';
import { CategoryNotFoundError } from '../../domain/errors/taxonomy.errors';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { CATEGORY_REPOSITORY } from '../../taxonomy.constants';

@Injectable()
export class GetCategoryUseCase {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort) {}

  async execute(id: string): Promise<CategoryEntity> {
    const category = await this.categories.findById(id);
    if (!category) {
      throw new CategoryNotFoundError();
    }
    return category;
  }
}
