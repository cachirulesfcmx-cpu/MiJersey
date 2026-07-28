import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { SearchProductsUseCase } from '../../../attributes/application/use-cases/search-products.use-case';
import { SearchProductsQueryDto } from '../../../attributes/presentation/dto/search-products-query.dto';
import { AttributeExceptionFilter } from '../../../attributes/presentation/filters/attribute-exception.filter';
import { parseFiltersParam } from '../../../attributes/presentation/util/parse-filters.util';
import { GetPublicBrandUseCase } from '../../application/use-cases/get-public-brand.use-case';
import { ListPublicBrandsUseCase } from '../../application/use-cases/list-public-brands.use-case';
import { BrandExceptionFilter } from '../filters/brand-exception.filter';

/** Solo expone marcas `ACTIVE`; usado por el storefront (apps/web). */
@Controller('brands')
@Public()
@UseFilters(BrandExceptionFilter)
export class PublicBrandsController {
  constructor(
    private readonly listPublicBrandsUseCase: ListPublicBrandsUseCase,
    private readonly getPublicBrandUseCase: GetPublicBrandUseCase,
    private readonly searchProductsUseCase: SearchProductsUseCase,
  ) {}

  @Get()
  async list() {
    const brands = await this.listPublicBrandsUseCase.execute();
    return { items: brands };
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.getPublicBrandUseCase.execute(slug);
  }

  /** Delega en el motor de búsqueda de Attributes (014) con `brandId` como alcance — mismo motor que `/products/search` y `/categories/:slug/products`. */
  @Get(':slug/products')
  @UseFilters(AttributeExceptionFilter)
  async listProducts(@Param('slug') slug: string, @Query() query: SearchProductsQueryDto) {
    const brand = await this.getPublicBrandUseCase.execute(slug);
    const result = await this.searchProductsUseCase.execute({
      filters: parseFiltersParam(query.filters),
      page: query.page,
      pageSize: query.pageSize,
      brandId: brand.id,
      ...(query.sortBy ? { sortBy: query.sortBy } : {}),
      ...(query.sortDir ? { sortDir: query.sortDir } : {}),
      ...(query.search ? { search: query.search } : {}),
    });
    return { items: result.items, total: result.total, page: query.page, pageSize: query.pageSize };
  }
}
