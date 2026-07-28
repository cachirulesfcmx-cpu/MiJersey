import { Inject, Injectable } from '@nestjs/common';

import type { RedirectRepositoryPort } from '../../domain/ports/redirect.repository.port';
import { buildEntityPath, type SeoEntityType } from '../../domain/value-objects/seo-enums';
import { REDIRECT_REPOSITORY } from '../../seo.constants';

const PERMANENT_REDIRECT_STATUS = 301;

/**
 * Punto de integración para otros módulos (Catalog/Taxonomy/Brands): registran
 * un cambio de slug para que se cree una redirección permanente automática
 * (spec §4 "redirecciones permanentes cuando cambie un slug"), sin que SEO
 * necesite conocer el dominio de quien la llama — mismo patrón que
 * `MediaUsageService` en 010.
 */
@Injectable()
export class SeoRedirectService {
  constructor(@Inject(REDIRECT_REPOSITORY) private readonly redirects: RedirectRepositoryPort) {}

  async recordSlugChange(
    entityType: SeoEntityType,
    previousSlug: string,
    nextSlug: string,
  ): Promise<void> {
    if (previousSlug === nextSlug) {
      return;
    }

    const fromPath = buildEntityPath(entityType, previousSlug);
    const toPath = buildEntityPath(entityType, nextSlug);

    await this.redirects.upsertByFromPath({
      fromPath,
      toPath,
      statusCode: PERMANENT_REDIRECT_STATUS,
    });
  }
}
