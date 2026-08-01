import { Inject, Injectable } from '@nestjs/common';

import { PAGE_REPOSITORY } from '../../cms.constants';
import type { PageEntity, PageProps } from '../../domain/entities/page.entity';
import type { PageBlockProps } from '../../domain/entities/page-block.entity';
import { PageNotFoundError } from '../../domain/errors/cms.errors';
import type { PageRepositoryPort } from '../../domain/ports/page.repository.port';
import { PageStatus } from '../../domain/value-objects/page-enums';
import { CmsCacheService } from '../services/cms-cache.service';

export type PublishedPageView = Omit<PageProps, 'blocks'> & { blocks: PageBlockProps[] };

/** Lectura pública cacheada (spec §8 "caché de páginas publicadas"). Una página `SCHEDULED` cuya fecha ya llegó se promueve a `PUBLISHED` en este mismo paso (persistiendo el cambio) — no hay cron; el primer visitante después de la hora programada dispara la promoción. `DRAFT`/`ARCHIVED`, y `SCHEDULED` aún futuro, son invisibles al público (mismo `PageNotFoundError` que "no existe", sin filtrar su estado interno). */
@Injectable()
export class GetPublishedPageUseCase {
  constructor(
    @Inject(PAGE_REPOSITORY) private readonly pages: PageRepositoryPort,
    private readonly cache: CmsCacheService,
  ) {}

  async execute(slug: string): Promise<PublishedPageView> {
    const cached = await this.cache.getPage(slug);
    if (cached) return JSON.parse(cached) as PublishedPageView;

    const page = await this.resolve(slug);
    if (!page) throw new PageNotFoundError();

    const view = page.toJSON();
    await this.cache.setPage(slug, JSON.stringify(view));
    return view;
  }

  private async resolve(slug: string): Promise<PageEntity | null> {
    const page = await this.pages.findBySlug(slug);
    if (!page) return null;

    if (page.status === PageStatus.PUBLISHED) return page;

    if (
      page.status === PageStatus.SCHEDULED &&
      page.publishedAt &&
      page.publishedAt <= new Date()
    ) {
      return this.pages.updateStatus(page.id, PageStatus.PUBLISHED, page.publishedAt);
    }

    return null;
  }
}
