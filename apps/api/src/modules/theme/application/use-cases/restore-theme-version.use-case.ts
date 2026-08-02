import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { ThemeStateView } from '../../domain/entities/theme-state';
import { toThemeStateView } from '../../domain/entities/theme-state';
import { ThemeVersionNotFoundError } from '../../domain/errors/theme.errors';
import type { ThemeRepositoryPort } from '../../domain/ports/theme.repository.port';
import type { ThemeVersionRepositoryPort } from '../../domain/ports/theme-version.repository.port';
import { toThemeSnapshot } from '../../domain/value-objects/theme-snapshot.util';
import { THEME_REPOSITORY, THEME_VERSION_REPOSITORY } from '../../theme.constants';

export interface RestoreThemeVersionInput {
  versionNumber: number;
  actorUserId: string;
  ipAddress: string | null;
}

/** Restaurar no borra historial: aplica el snapshot elegido al borrador y guarda el resultado como una versión NUEVA, sin tocar la caché pública — solo `PublishThemeUseCase` publica (mismo criterio que CMS Pages/Blog/Navigation). */
@Injectable()
export class RestoreThemeVersionUseCase {
  constructor(
    @Inject(THEME_REPOSITORY) private readonly theme: ThemeRepositoryPort,
    @Inject(THEME_VERSION_REPOSITORY) private readonly versions: ThemeVersionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: RestoreThemeVersionInput): Promise<ThemeStateView> {
    const version = await this.versions.findByNumber(input.versionNumber);
    if (!version) throw new ThemeVersionNotFoundError();

    const restored = await this.theme.applySnapshot(version.snapshot);
    await this.versions.create(toThemeSnapshot(restored));

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'theme.version_restored',
      ipAddress: input.ipAddress,
      metadata: { restoredFrom: input.versionNumber },
    });

    return toThemeStateView(restored);
  }
}
