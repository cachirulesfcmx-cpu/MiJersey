import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { ThemeState, ThemeStateView } from '../../domain/entities/theme-state';
import { toThemeStateView } from '../../domain/entities/theme-state';
import { InvalidThemeSectionError } from '../../domain/errors/theme.errors';
import type {
  ThemeRepositoryPort,
  UpdateThemeStateData,
} from '../../domain/ports/theme.repository.port';
import type { ThemeVersionRepositoryPort } from '../../domain/ports/theme-version.repository.port';
import { validateThemeSectionConfig } from '../../domain/value-objects/theme-section-config';
import { toThemeSnapshot } from '../../domain/value-objects/theme-snapshot.util';
import { THEME_REPOSITORY, THEME_VERSION_REPOSITORY } from '../../theme.constants';

export interface UpdateThemeInput extends UpdateThemeStateData {
  actorUserId: string;
  ipAddress: string | null;
}

/** `PATCH /admin/theme` edita el borrador (spec §4 "publicar cambios de forma controlada": guardar y publicar son acciones distintas) y deja una versión nueva en el historial — no toca la caché pública, que solo cambia con `PublishThemeUseCase`. */
@Injectable()
export class UpdateThemeUseCase {
  constructor(
    @Inject(THEME_REPOSITORY) private readonly theme: ThemeRepositoryPort,
    @Inject(THEME_VERSION_REPOSITORY) private readonly versions: ThemeVersionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateThemeInput): Promise<ThemeStateView> {
    for (const section of input.sections ?? []) {
      const error = validateThemeSectionConfig(section.section, section.config);
      if (error) throw new InvalidThemeSectionError(error);
    }

    const { actorUserId, ipAddress, ...data } = input;
    const state: ThemeState = await this.theme.update(data);

    await this.versions.create(toThemeSnapshot(state));

    await this.auditLog.record({
      userId: actorUserId,
      action: 'theme.updated',
      ipAddress,
      metadata: {
        updatedSettings: Object.keys(input.settings ?? {}),
        updatedSections: (input.sections ?? []).map((section) => section.section),
      },
    });

    return toThemeStateView(state);
  }
}
