import { Controller, Get, Param, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { GetPublicVariantUseCase } from '../../application/use-cases/get-public-variant.use-case';
import { CatalogExceptionFilter } from '../filters/catalog-exception.filter';

/** `GET /variants/:id` (015) — refresco puntual de una variante desde la PDP. */
@Controller('variants')
@Public()
@UseFilters(CatalogExceptionFilter)
export class PublicVariantsController {
  constructor(private readonly getPublicVariantUseCase: GetPublicVariantUseCase) {}

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.getPublicVariantUseCase.execute(id);
  }
}
