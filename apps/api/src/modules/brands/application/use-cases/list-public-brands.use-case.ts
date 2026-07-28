import { Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import { GetSeoMetadataUseCase } from '../../../seo/application/use-cases/get-seo-metadata.use-case';
import { BRAND_REPOSITORY } from '../../brands.constants';
import type { BrandRepositoryPort } from '../../domain/ports/brand.repository.port';
import { type PublicBrandView, toPublicBrandView } from './public-brand-view';

/** Marcas `ACTIVE` ordenadas por `sortOrder` — para el índice público de marcas. */
@Injectable()
export class ListPublicBrandsUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepositoryPort,
    private readonly mediaUsage: MediaUsageService,
    private readonly seoMetadata: GetSeoMetadataUseCase,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async execute(): Promise<PublicBrandView[]> {
    const brands = await this.brands.findAllActive();
    return Promise.all(
      brands.map((brand) =>
        toPublicBrandView(brand, {
          mediaUsage: this.mediaUsage,
          seoMetadata: this.seoMetadata,
          publicWebUrl: this.config.publicWebUrl,
        }),
      ),
    );
  }
}
