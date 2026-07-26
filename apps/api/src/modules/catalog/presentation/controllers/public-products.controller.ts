import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { GetPublicProductUseCase } from '../../application/use-cases/get-public-product.use-case';
import { ListPublicProductsUseCase } from '../../application/use-cases/list-public-products.use-case';
import { ListPublicProductsQueryDto } from '../dto/list-public-products-query.dto';
import { CatalogExceptionFilter } from '../filters/catalog-exception.filter';

/** Solo expone productos ACTIVE + PUBLIC; usado por el storefront (apps/web). */
@Controller('products')
@Public()
@UseFilters(CatalogExceptionFilter)
export class PublicProductsController {
  constructor(
    private readonly listPublicProductsUseCase: ListPublicProductsUseCase,
    private readonly getPublicProductUseCase: GetPublicProductUseCase,
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

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return (await this.getPublicProductUseCase.execute(slug)).toJSON();
  }
}
