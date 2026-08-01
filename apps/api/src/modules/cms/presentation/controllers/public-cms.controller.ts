import { Controller, Get, Param, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { GetPublishedPageUseCase } from '../../application/use-cases/get-published-page.use-case';
import { CmsExceptionFilter } from '../filters/cms-exception.filter';

/** Render público de páginas publicadas (spec 026 §6/§8), cacheado — ver `GetPublishedPageUseCase`. */
@Controller('pages')
@Public()
@UseFilters(CmsExceptionFilter)
export class PublicCmsController {
  constructor(private readonly getPublishedPage: GetPublishedPageUseCase) {}

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.getPublishedPage.execute(slug);
  }
}
