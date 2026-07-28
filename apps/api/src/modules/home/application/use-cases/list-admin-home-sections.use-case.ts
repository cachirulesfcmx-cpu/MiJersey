import { Inject, Injectable } from '@nestjs/common';

import type { HomeSectionEntity } from '../../domain/entities/home-section.entity';
import type { HomeSectionRepositoryPort } from '../../domain/ports/home-section.repository.port';
import { HOME_SECTION_REPOSITORY } from '../../home.constants';

/** Todas las secciones (incluye borrador/oculta) ordenadas por `sortOrder` — para el editor administrativo. */
@Injectable()
export class ListAdminHomeSectionsUseCase {
  constructor(
    @Inject(HOME_SECTION_REPOSITORY) private readonly sections: HomeSectionRepositoryPort,
  ) {}

  execute(): Promise<HomeSectionEntity[]> {
    return this.sections.findAll();
  }
}
