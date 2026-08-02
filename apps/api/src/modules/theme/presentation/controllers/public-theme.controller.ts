import { Controller, Get, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { GetPublishedThemeUseCase } from '../../application/use-cases/get-published-theme.use-case';
import { ThemeExceptionFilter } from '../filters/theme-exception.filter';

/** Lectura pública del tema publicado (spec §12) — el storefront la consume para pintar variables CSS y renderizar Header/Footer/Banners globales. */
@Controller('theme')
@Public()
@UseFilters(ThemeExceptionFilter)
export class PublicThemeController {
  constructor(private readonly getPublishedTheme: GetPublishedThemeUseCase) {}

  @Get()
  async get() {
    return this.getPublishedTheme.execute();
  }
}
