import { Inject, Injectable } from '@nestjs/common';

import { BRAND_REPOSITORY } from '../../brands.constants';
import type { BrandEntity } from '../../domain/entities/brand.entity';
import { BrandNotFoundError } from '../../domain/errors/brand.errors';
import type { BrandRepositoryPort } from '../../domain/ports/brand.repository.port';

@Injectable()
export class GetBrandUseCase {
  constructor(@Inject(BRAND_REPOSITORY) private readonly brands: BrandRepositoryPort) {}

  async execute(id: string): Promise<BrandEntity> {
    const brand = await this.brands.findById(id);
    if (!brand) {
      throw new BrandNotFoundError();
    }
    return brand;
  }
}
