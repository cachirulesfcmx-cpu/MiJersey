import { Controller, Get, Param, Query, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { GetRenderedMenuUseCase } from '../../application/use-cases/get-rendered-menu.use-case';
import { RenderMenuQueryDto } from '../dto/render-menu-query.dto';
import { NavigationExceptionFilter } from '../filters/navigation-exception.filter';

/** Render público del menú publicado en una ubicación (spec §7 "GET /navigation/render/:location"), cacheado — ver `GetRenderedMenuUseCase`. Una ubicación sin menú publicado responde con un árbol vacío, no un error. */
@Controller('navigation')
@Public()
@UseFilters(NavigationExceptionFilter)
export class PublicNavigationController {
  constructor(private readonly getRenderedMenu: GetRenderedMenuUseCase) {}

  @Get('render/:location')
  async render(@Param('location') location: string, @Query() query: RenderMenuQueryDto) {
    return this.getRenderedMenu.execute(location, {
      authenticated: query.authenticated ?? false,
      device: query.device ?? null,
    });
  }
}
