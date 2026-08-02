import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { SiteConfigurationProps } from '../../domain/entities/site-configuration.entity';
import { InvalidSiteConfigurationError } from '../../domain/errors/site-config.errors';
import type {
  SiteConfigurationRepositoryPort,
  UpdateSiteConfigurationData,
} from '../../domain/ports/site-configuration.repository.port';
import { validateSiteConfigurationInput } from '../../domain/value-objects/site-configuration-validation';
import { SITE_CONFIGURATION_REPOSITORY } from '../../site-config.constants';
import { SiteConfigCacheService } from '../services/site-config-cache.service';

export interface UpdateSiteConfigurationInput extends UpdateSiteConfigurationData {
  actorUserId: string;
  ipAddress: string | null;
}

/** `PATCH /admin/settings/site` — a diferencia de Theme (029), no hay borrador/publicación separados: el cambio se valida, se persiste y se refleja en la caché de inmediato (spec §4 "publicar cambios de forma controlada" se satisface con la validación previa a persistir, no con un paso de publicación aparte). */
@Injectable()
export class UpdateSiteConfigurationUseCase {
  constructor(
    @Inject(SITE_CONFIGURATION_REPOSITORY)
    private readonly repository: SiteConfigurationRepositoryPort,
    private readonly cache: SiteConfigCacheService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateSiteConfigurationInput): Promise<SiteConfigurationProps> {
    const { actorUserId, ipAddress, ...data } = input;

    const error = validateSiteConfigurationInput(data);
    if (error) throw new InvalidSiteConfigurationError(error);

    const updated = await this.repository.update(data);
    const view = updated.toJSON();

    await this.cache.set(JSON.stringify(view));

    await this.auditLog.record({
      userId: actorUserId,
      action: 'site_config.updated',
      ipAddress,
      metadata: { updatedFields: Object.keys(data) },
    });

    return view;
  }
}
