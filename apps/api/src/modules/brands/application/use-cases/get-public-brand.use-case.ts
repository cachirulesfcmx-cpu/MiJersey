import { Inject, Injectable } from '@nestjs/common';

import { MediaUsageService } from '../../../media/application/services/media-usage.service';
import { BRAND_REPOSITORY } from '../../brands.constants';
import { BrandNotFoundError } from '../../domain/errors/brand.errors';
import type { BrandRepositoryPort } from '../../domain/ports/brand.repository.port';
import { type PublicBrandView, toPublicBrandView } from './public-brand-view';

@Injectable()
export class GetPublicBrandUseCase {
  constructor(
    @Inject(BRAND_REPOSITORY) private readonly brands: BrandRepositoryPort,
    private readonly mediaUsage: MediaUsageService,
  ) {}

  async execute(slug: string): Promise<PublicBrandView> {
    const brand = await this.brands.findPublicBySlug(slug);
    if (!brand) {
      throw new BrandNotFoundError();
    }
    return toPublicBrandView(brand, this.mediaUsage);
  }
}
