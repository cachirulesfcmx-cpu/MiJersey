import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { GetPublicCollectionUseCase } from '../../application/use-cases/get-public-collection.use-case';
import { ListPublicCollectionsUseCase } from '../../application/use-cases/list-public-collections.use-case';
import { ListPublicCollectionsQueryDto } from '../dto/list-public-collections-query.dto';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { TaxonomyExceptionFilter } from '../filters/taxonomy-exception.filter';

/** Solo expone colecciones ACTIVE, con productos filtrados a ACTIVE + PUBLIC. */
@Controller('collections')
@Public()
@UseFilters(TaxonomyExceptionFilter)
export class PublicCollectionsController {
  constructor(
    private readonly listPublicCollectionsUseCase: ListPublicCollectionsUseCase,
    private readonly getPublicCollectionUseCase: GetPublicCollectionUseCase,
  ) {}

  @Get()
  async list(@Query() query: ListPublicCollectionsQueryDto) {
    const result = await this.listPublicCollectionsUseCase.execute(query);
    return { ...result, page: query.page, pageSize: query.pageSize };
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string, @Query() query: PaginationQueryDto) {
    const { collection, products, total } = await this.getPublicCollectionUseCase.execute({
      slug,
      page: query.page,
      pageSize: query.pageSize,
    });

    return { ...collection.toJSON(), products, total, page: query.page, pageSize: query.pageSize };
  }
}
