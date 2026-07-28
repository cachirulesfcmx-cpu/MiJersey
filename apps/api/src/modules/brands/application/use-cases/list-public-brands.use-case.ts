import { Inject, Injectable } from '@nestjs/common';

import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import { BRAND_REPOSITORY } from '../../brands.constants';
import type { BrandRepositoryPort } from '../../domain/ports/brand.repository.port';
import { type PublicBrandView, toPublicBrandView } from './public-brand-view';

/** Marcas `ACTIVE` ordenadas por `sortOrder` — para el índice público de marcas. */
@Injectable()
export class ListPublicBrandsUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepositoryPort,
    private readonly mediaUsage: MediaUsageService,
  ) {}

  async execute(): Promise<PublicBrandView[]> {
    const brands = await this.brands.findAllActive();
    return Promise.all(brands.map((brand) => toPublicBrandView(brand, this.mediaUsage)));
  }
}
