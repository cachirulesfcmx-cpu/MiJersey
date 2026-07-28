import { Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';
import { GetSeoMetadataUseCase } from '../../../seo/application/use-cases/get-seo-metadata.use-case';
import { CategoryNotFoundError } from '../../domain/errors/taxonomy.errors';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';
import { CategoryStatus } from '../../domain/value-objects/taxonomy-enums';
import { CATEGORY_REPOSITORY } from '../../taxonomy.constants';
import { GetCategoryPathUseCase } from './get-category-path.use-case';
import { type PublicCategoryView, toPublicCategoryView } from './public-category-view';

@Injectable()
export class GetPublicCategoryUseCase {
  constructor(
    @Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepositoryPort,
    private readonly getCategoryPath: GetCategoryPathUseCase,
    private readonly seoMetadata: GetSeoMetadataUseCase,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async execute(slug: string): Promise<PublicCategoryView> {
    const category = await this.categories.findBySlug(slug);
    if (!category || category.status !== CategoryStatus.ACTIVE) {
      throw new CategoryNotFoundError();
    }

    const path = await this.getCategoryPath.execute(category.id);
    const breadcrumbs = path.map((ancestor) => ({
      id: ancestor.id,
      slug: ancestor.slug,
      name: ancestor.name,
    }));

    return toPublicCategoryView(category, {
      seoMetadata: this.seoMetadata,
      publicWebUrl: this.config.publicWebUrl,
      breadcrumbs,
    });
  }
}
