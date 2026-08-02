import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { TrackingProviderEntity } from '../../domain/entities/tracking-provider.entity';
import {
  InvalidTrackingConfigurationError,
  TrackingProviderNotFoundError,
} from '../../domain/errors/tracking.errors';
import type { TrackingProviderRepositoryPort } from '../../domain/ports/tracking-provider.repository.port';
import { validateTrackingConfiguration } from '../../domain/value-objects/tracking-configuration.util';
import type { TrackingProviderStatus } from '../../domain/value-objects/tracking-provider-enums';
import { TRACKING_PROVIDER_REPOSITORY } from '../../tracking.constants';

export interface UpdateTrackingProviderInput {
  id: string;
  status?: TrackingProviderStatus;
  configuration?: Record<string, unknown>;
  consentCategory?: string | null;
  actorUserId: string;
  ipAddress: string | null;
}

/** El `configuration` enviado en el PATCH se mezcla (shallow merge) con el existente antes de validar y guardar — permite actualizar un solo campo (ej. rotar `accessToken`) sin reenviar toda la configuración. */
@Injectable()
export class UpdateTrackingProviderUseCase {
  constructor(
    @Inject(TRACKING_PROVIDER_REPOSITORY)
    private readonly providers: TrackingProviderRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateTrackingProviderInput): Promise<TrackingProviderEntity> {
    const existing = await this.providers.findById(input.id);
    if (!existing) throw new TrackingProviderNotFoundError();

    const existingJson = existing.toJSON();
    const mergedConfiguration = input.configuration
      ? { ...existingJson.configuration, ...input.configuration }
      : undefined;

    if (mergedConfiguration) {
      const missing = validateTrackingConfiguration(existingJson.provider, mergedConfiguration);
      if (missing.length > 0) throw new InvalidTrackingConfigurationError(missing);
    }

    const updated = await this.providers.update(input.id, {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(mergedConfiguration !== undefined ? { configuration: mergedConfiguration } : {}),
      ...(input.consentCategory !== undefined ? { consentCategory: input.consentCategory } : {}),
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'tracking.provider_updated',
      ipAddress: input.ipAddress,
      metadata: {
        providerId: input.id,
        updatedFields: Object.keys(input).filter((key) =>
          ['status', 'configuration', 'consentCategory'].includes(key),
        ),
      },
    });

    return updated;
  }
}
