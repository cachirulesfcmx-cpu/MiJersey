import { Inject, Injectable } from '@nestjs/common';

import type { HomeSectionRepositoryPort } from '../../domain/ports/home-section.repository.port';
import { HOME_SECTION_REPOSITORY } from '../../home.constants';
import {
  HomeEnrichmentService,
  type PublicHomeSectionView,
} from '../services/home-enrichment.service';

/** Secciones `PUBLISHED` + visibles, ordenadas y enriquecidas — lo que renderiza `apps/web`. */
@Injectable()
export class GetPublicHomeUseCase {
  constructor(
    @Inject(HOME_SECTION_REPOSITORY) private readonly sections: HomeSectionRepositoryPort,
    private readonly enrichment: HomeEnrichmentService,
  ) {}

  async execute(): Promise<PublicHomeSectionView[]> {
    const published = await this.sections.findPublished();
    return this.enrichment.enrich(published);
  }
}
