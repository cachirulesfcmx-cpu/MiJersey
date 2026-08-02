import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { TrackingProviderEntity } from '../../domain/entities/tracking-provider.entity';
import {
  DuplicateTrackingProviderError,
  InvalidTrackingConfigurationError,
} from '../../domain/errors/tracking.errors';
import type { TrackingProviderRepositoryPort } from '../../domain/ports/tracking-provider.repository.port';
import { validateTrackingConfiguration } from '../../domain/value-objects/tracking-configuration.util';
import type {
  TrackingProviderStatus,
  TrackingProviderType,
} from '../../domain/value-objects/tracking-provider-enums';
import { TRACKING_PROVIDER_REPOSITORY } from '../../tracking.constants';

export interface CreateTrackingProviderInput {
  provider: TrackingProviderType;
  status?: TrackingProviderStatus;
  configuration: Record<string, unknown>;
  consentCategory?: string | null;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateTrackingProviderUseCase {
  constructor(
    @Inject(TRACKING_PROVIDER_REPOSITORY)
    private readonly providers: TrackingProviderRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateTrackingProviderInput): Promise<TrackingProviderEntity> {
    const existing = await this.providers.findByProvider(input.provider);
    if (existing) throw new DuplicateTrackingProviderError();

    const missing = validateTrackingConfiguration(input.provider, input.configuration);
    if (missing.length > 0) throw new InvalidTrackingConfigurationError(missing);

    const created = await this.providers.create(input.provider, {
      status: input.status ?? 'INACTIVE',
      configuration: input.configuration,
      consentCategory: input.consentCategory ?? null,
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'tracking.provider_created',
      ipAddress: input.ipAddress,
      metadata: { providerId: created.id, provider: input.provider },
    });

    return created;
  }
}
