import { Controller, Get, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { GetPublicCategoryTreeUseCase } from '../../application/use-cases/get-public-category-tree.use-case';
import { TaxonomyExceptionFilter } from '../filters/taxonomy-exception.filter';

/** Árbol de categorías `ACTIVE`, cacheado en Redis (ver TaxonomyCacheService). */
@Controller('categories')
@Public()
@UseFilters(TaxonomyExceptionFilter)
export class PublicCategoriesController {
  constructor(private readonly getPublicCategoryTreeUseCase: GetPublicCategoryTreeUseCase) {}

  @Get()
  getTree() {
    return this.getPublicCategoryTreeUseCase.execute();
  }
}
