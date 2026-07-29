import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { SearchProductsUseCase } from '../../../attributes/application/use-cases/search-products.use-case';
import { SearchProductsQueryDto } from '../../../attributes/presentation/dto/search-products-query.dto';
import { AttributeExceptionFilter } from '../../../attributes/presentation/filters/attribute-exception.filter';
import { parseFiltersParam } from '../../../attributes/presentation/util/parse-filters.util';
import { GetPublicProductUseCase } from '../../application/use-cases/get-public-product.use-case';
import { GetPublicProductVariantsUseCase } from '../../application/use-cases/get-public-product-variants.use-case';
import { GetRelatedProductsUseCase } from '../../application/use-cases/get-related-products.use-case';
import { ListPublicProductsUseCase } from '../../application/use-cases/list-public-products.use-case';
import { ListPublicProductsQueryDto } from '../dto/list-public-products-query.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { RelatedProductsQueryDto } from '../dto/related-products-query.dto';
import { CatalogExceptionFilter } from '../filters/catalog-exception.filter';

/** Solo expone productos ACTIVE + PUBLIC; usado por el storefront (apps/web). */
@Controller('products')
@Public()
@UseFilters(CatalogExceptionFilter)
export class PublicProductsController {
  constructor(
    private readonly listPublicProductsUseCase: ListPublicProductsUseCase,
    private readonly getPublicProductUseCase: GetPublicProductUseCase,
    private readonly getPublicProductVariantsUseCase: GetPublicProductVariantsUseCase,
    private readonly getRelatedProductsUseCase: GetRelatedProductsUseCase,
    private readonly searchProductsUseCase: SearchProductsUseCase,
  ) {}

  @Get()
  async list(@Query() query: ListPublicProductsQueryDto) {
    const result = await this.listPublicProductsUseCase.execute(query);

    return {
      items: result.items.map((product) => product.toJSON()),
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  // Declarado antes de ':slug' para que Express no confunda "search" con un slug (mismo caso que 005/006/007).
  @Get('search')
  @UseFilters(AttributeExceptionFilter)
  async search(@Query() query: SearchProductsQueryDto) {
    const result = await this.searchProductsUseCase.execute({
      filters: parseFiltersParam(query.filters),
      page: query.page,
      pageSize: query.pageSize,
      ...(query.sortBy ? { sortBy: query.sortBy } : {}),
      ...(query.sortDir ? { sortDir: query.sortDir } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.brandId ? { brandId: query.brandId } : {}),
      ...(query.search ? { search: query.search } : {}),
    });

    return {
      items: result.items,
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.getPublicProductUseCase.execute(slug);
  }

  @Get(':slug/variants')
  async getVariants(@Param('slug') slug: string, @Query() query: PaginationQueryDto) {
    const result = await this.getPublicProductVariantsUseCase.execute({ slug, ...query });

    return {
      items: result.items.map((variant) => variant.toJSON()),
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  @Get(':slug/related')
  async getRelated(@Param('slug') slug: string, @Query() query: RelatedProductsQueryDto) {
    const items = await this.getRelatedProductsUseCase.execute(slug, query.limit);
    return { items };
  }
}
