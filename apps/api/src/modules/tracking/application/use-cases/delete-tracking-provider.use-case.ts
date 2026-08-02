import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { TrackingProviderNotFoundError } from '../../domain/errors/tracking.errors';
import type { TrackingProviderRepositoryPort } from '../../domain/ports/tracking-provider.repository.port';
import { TRACKING_PROVIDER_REPOSITORY } from '../../tracking.constants';

export interface DeleteTrackingProviderInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteTrackingProviderUseCase {
  constructor(
    @Inject(TRACKING_PROVIDER_REPOSITORY)
    private readonly providers: TrackingProviderRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteTrackingProviderInput): Promise<void> {
    const existing = await this.providers.findById(input.id);
    if (!existing) throw new TrackingProviderNotFoundError();

    await this.providers.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'tracking.provider_deleted',
      ipAddress: input.ipAddress,
      metadata: { providerId: input.id, provider: existing.provider },
    });
  }
}
