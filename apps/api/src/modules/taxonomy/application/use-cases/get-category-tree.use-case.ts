import { Inject, Injectable } from '@nestjs/common';

import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { CATEGORY_REPOSITORY } from '../../taxonomy.constants';
import { buildTree, type CategoryTreeNode } from './category-tree.util';

/** Árbol completo (cualquier estado), para el editor jerárquico del panel. */
@Injectable()
export class GetCategoryTreeUseCase {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort) {}

  async execute(): Promise<CategoryTreeNode[]> {
    const flat = await this.categories.findAll();
    return buildTree(flat);
  }
}
