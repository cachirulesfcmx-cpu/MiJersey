import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { Public } from '../../../../common/decorators/public.decorator';
import { GenerateSitemapUseCase } from '../../application/use-cases/generate-sitemap.use-case';
import { GetRobotsTxtUseCase } from '../../application/use-cases/get-robots-txt.use-case';
import { ResolveRedirectUseCase } from '../../application/use-cases/resolve-redirect.use-case';
import { ResolveRedirectQueryDto } from '../dto/resolve-redirect-query.dto';

/** Rutas de nivel raíz consumidas por buscadores y por el middleware de redirecciones del storefront (apps/web). */
@Controller()
@Public()
export class PublicSeoController {
  constructor(
    private readonly generateSitemapUseCase: GenerateSitemapUseCase,
    private readonly getRobotsTxtUseCase: GetRobotsTxtUseCase,
    private readonly resolveRedirectUseCase: ResolveRedirectUseCase,
  ) {}

  @Get('sitemap.xml')
  async sitemap(@Res() res: Response) {
    const xml = await this.generateSitemapUseCase.execute();
    res.type('application/xml').send(xml);
  }

  @Get('robots.txt')
  robots(@Res() res: Response) {
    res.type('text/plain').send(this.getRobotsTxtUseCase.execute());
  }

  @Get('redirects/resolve')
  resolveRedirect(@Query() query: ResolveRedirectQueryDto) {
    return this.resolveRedirectUseCase.execute(query.path);
  }
}
