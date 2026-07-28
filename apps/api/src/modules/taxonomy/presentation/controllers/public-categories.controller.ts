import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { SearchProductsUseCase } from '../../../attributes/application/use-cases/search-products.use-case';
import { SearchProductsQueryDto } from '../../../attributes/presentation/dto/search-products-query.dto';
import { AttributeExceptionFilter } from '../../../attributes/presentation/filters/attribute-exception.filter';
import { parseFiltersParam } from '../../../attributes/presentation/util/parse-filters.util';
import { GetPublicCategoryUseCase } from '../../application/use-cases/get-public-category.use-case';
import { GetPublicCategoryTreeUseCase } from '../../application/use-cases/get-public-category-tree.use-case';
import { TaxonomyExceptionFilter } from '../filters/taxonomy-exception.filter';

/** Árbol de categorías `ACTIVE`, cacheado en Redis (ver TaxonomyCacheService). */
@Controller('categories')
@Public()
@UseFilters(TaxonomyExceptionFilter)
export class PublicCategoriesController {
  constructor(
    private readonly getPublicCategoryTreeUseCase: GetPublicCategoryTreeUseCase,
    private readonly getPublicCategoryUseCase: GetPublicCategoryUseCase,
    private readonly searchProductsUseCase: SearchProductsUseCase,
  ) {}

  @Get()
  getTree() {
    return this.getPublicCategoryTreeUseCase.execute();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.getPublicCategoryUseCase.execute(slug);
  }

  /** Delega en el motor de búsqueda de Attributes (014) con `categoryId` como alcance — mismo motor que `/products/search` y `/brands/:slug/products`. */
  @Get(':slug/products')
  @UseFilters(AttributeExceptionFilter)
  async listProducts(@Param('slug') slug: string, @Query() query: SearchProductsQueryDto) {
    const category = await this.getPublicCategoryUseCase.execute(slug);
    const result = await this.searchProductsUseCase.execute({
      filters: parseFiltersParam(query.filters),
      page: query.page,
      pageSize: query.pageSize,
      categoryId: category.id,
      ...(query.sortBy ? { sortBy: query.sortBy } : {}),
      ...(query.sortDir ? { sortDir: query.sortDir } : {}),
      ...(query.search ? { search: query.search } : {}),
    });
    return { items: result.items, total: result.total, page: query.page, pageSize: query.pageSize };
  }
}
