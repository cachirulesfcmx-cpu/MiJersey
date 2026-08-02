import { Inject, Injectable } from '@nestjs/common';

import type { ThemeStateView } from '../../domain/entities/theme-state';
import { toThemeStateView } from '../../domain/entities/theme-state';
import type { ThemeRepositoryPort } from '../../domain/ports/theme.repository.port';
import { THEME_REPOSITORY } from '../../theme.constants';
import { ThemeCacheService } from '../services/theme-cache.service';

/** Lectura pública (`GET /theme`) — sirve exclusivamente la caché escrita por `PublishThemeUseCase`. Si nunca se ha publicado (instalación nueva, spec §12 "el storefront refleje la configuración activa"), siembra la caché con el borrador actual (valores por defecto en la primera visita) para que el storefront nunca quede sin tema; después de eso, solo una publicación explícita vuelve a escribirla. */
@Injectable()
export class GetPublishedThemeUseCase {
  constructor(
    @Inject(THEME_REPOSITORY) private readonly theme: ThemeRepositoryPort,
    private readonly cache: ThemeCacheService,
  ) {}

  async execute(): Promise<ThemeStateView> {
    const cached = await this.cache.getPublished();
    if (cached) return JSON.parse(cached) as ThemeStateView;

    const state = await this.theme.getState();
    const view = toThemeStateView(state);
    await this.cache.setPublished(JSON.stringify(view));
    return view;
  }
}
