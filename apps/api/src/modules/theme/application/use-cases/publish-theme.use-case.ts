import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { ThemeStateView } from '../../domain/entities/theme-state';
import { toThemeStateView } from '../../domain/entities/theme-state';
import type { ThemeRepositoryPort } from '../../domain/ports/theme.repository.port';
import type { ThemeVersionRepositoryPort } from '../../domain/ports/theme-version.repository.port';
import { toThemeSnapshot } from '../../domain/value-objects/theme-snapshot.util';
import { THEME_REPOSITORY, THEME_VERSION_REPOSITORY } from '../../theme.constants';
import { ThemeCacheService } from '../services/theme-cache.service';

export interface PublishThemeInput {
  actorUserId: string;
  ipAddress: string | null;
}

/** `POST /admin/theme/publish` — copia el borrador actual a la caché pública (lo único que ve el storefront) y deja una versión marcando el momento exacto de publicación, distinta de las versiones que deja cada `PATCH`. */
@Injectable()
export class PublishThemeUseCase {
  constructor(
    @Inject(THEME_REPOSITORY) private readonly theme: ThemeRepositoryPort,
    @Inject(THEME_VERSION_REPOSITORY) private readonly versions: ThemeVersionRepositoryPort,
    private readonly cache: ThemeCacheService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: PublishThemeInput): Promise<ThemeStateView> {
    const state = await this.theme.getState();
    const view = toThemeStateView(state);

    await this.cache.setPublished(JSON.stringify(view));
    await this.versions.create(toThemeSnapshot(state));

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'theme.published',
      ipAddress: input.ipAddress,
      metadata: { siteName: view.settings.siteName },
    });

    return view;
  }
}
