import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { GetPublicBrandUseCase } from '../../application/use-cases/get-public-brand.use-case';
import { ListBrandProductsUseCase } from '../../application/use-cases/list-brand-products.use-case';
import { ListPublicBrandsUseCase } from '../../application/use-cases/list-public-brands.use-case';
import { ListBrandProductsQueryDto } from '../dto/list-brand-products-query.dto';
import { BrandExceptionFilter } from '../filters/brand-exception.filter';

/** Solo expone marcas `ACTIVE`; usado por el storefront (apps/web). */
@Controller('brands')
@Public()
@UseFilters(BrandExceptionFilter)
export class PublicBrandsController {
  constructor(
    private readonly listPublicBrandsUseCase: ListPublicBrandsUseCase,
    private readonly getPublicBrandUseCase: GetPublicBrandUseCase,
    private readonly listBrandProductsUseCase: ListBrandProductsUseCase,
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

  @Get(':slug/products')
  async listProducts(@Param('slug') slug: string, @Query() query: ListBrandProductsQueryDto) {
    const brand = await this.getPublicBrandUseCase.execute(slug);
    const result = await this.listBrandProductsUseCase.execute({
      brandId: brand.id,
      page: query.page,
      pageSize: query.pageSize,
      onlyPublic: true,
      ...(query.sortBy ? { sortBy: query.sortBy } : {}),
      ...(query.sortDir ? { sortDir: query.sortDir } : {}),
    });
    return { items: result.items, total: result.total };
  }
}
