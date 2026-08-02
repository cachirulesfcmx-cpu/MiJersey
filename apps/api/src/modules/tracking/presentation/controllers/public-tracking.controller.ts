import { Controller, Get, UseFilters } from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { GetConsentCategoriesUseCase } from '../../application/use-cases/get-consent-categories.use-case';
import { GetPublicTrackingProvidersUseCase } from '../../application/use-cases/get-public-tracking-providers.use-case';
import { TrackingExceptionFilter } from '../filters/tracking-exception.filter';

/** Superficie pública (033 §7, literal `GET /tracking/providers`/`GET /tracking/consent` del spec) — sin autenticación, a diferencia del resto del módulo: la consume cualquier visitante del storefront (013 Home y demás páginas) antes de decidir/inyectar los scripts de medición, y no puede depender de un login. La gestión administrativa vive en `/admin/tracking/*`. */
@Controller('tracking')
@Public()
@UseFilters(TrackingExceptionFilter)
export class PublicTrackingController {
  constructor(
    private readonly getPublicProviders: GetPublicTrackingProvidersUseCase,
    private readonly getConsentCategories: GetConsentCategoriesUseCase,
  ) {}

  @Get('providers')
  async providers() {
    return this.getPublicProviders.execute();
  }

  @Get('consent')
  async consent() {
    const categories = await this.getConsentCategories.execute();
    return { categories };
  }
}
