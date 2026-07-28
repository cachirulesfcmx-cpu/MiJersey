import { Controller, Get, Query, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { GetFiltersUseCase } from '../../application/use-cases/get-filters.use-case';
import { FiltersQueryDto } from '../dto/filters-query.dto';
import { AttributeExceptionFilter } from '../filters/attribute-exception.filter';
import { parseFiltersParam } from '../util/parse-filters.util';

@Controller('filters')
@Public()
@UseFilters(AttributeExceptionFilter)
export class PublicFiltersController {
  constructor(private readonly getFiltersUseCase: GetFiltersUseCase) {}

  @Get()
  async get(@Query() query: FiltersQueryDto) {
    return this.getFiltersUseCase.execute(parseFiltersParam(query.filters), {
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.brandId ? { brandId: query.brandId } : {}),
      ...(query.search ? { search: query.search } : {}),
    });
  }
}
