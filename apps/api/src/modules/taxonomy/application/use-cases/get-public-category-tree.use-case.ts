import { Inject, Injectable } from '@nestjs/common';

import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { CATEGORY_REPOSITORY } from '../../taxonomy.constants';
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';
import { buildTree, type PlainCategoryTreeNode, toPlainTree } from './category-tree.util';

/** Árbol de categorías `ACTIVE` para la navegación pública, con caché en Redis. */
@Injectable()
export class GetPublicCategoryTreeUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort,
    private readonly cache: TaxonomyCacheService,
  ) {}

  async execute(): Promise<PlainCategoryTreeNode[]> {
    const cached = await this.cache.getCategoryTree();
    if (cached) {
      return JSON.parse(cached) as PlainCategoryTreeNode[];
    }

    const flat = await this.categories.findPublicAll();
    const tree = toPlainTree(buildTree(flat));
    await this.cache.setCategoryTree(JSON.stringify(tree));
    return tree;
  }
}
