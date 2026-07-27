import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { GetPublicProductUseCase } from '../../application/use-cases/get-public-product.use-case';
import { GetPublicProductVariantsUseCase } from '../../application/use-cases/get-public-product-variants.use-case';
import { ListPublicProductsUseCase } from '../../application/use-cases/list-public-products.use-case';
import { ListPublicProductsQueryDto } from '../dto/list-public-products-query.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
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
}
