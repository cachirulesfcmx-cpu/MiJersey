import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { TrackingProviderNotFoundError } from '../../domain/errors/tracking.errors';
import type { TrackingEventRepositoryPort } from '../../domain/ports/tracking-event.repository.port';
import type {
  DispatchTrackingEventResult,
  TrackingEventDispatcherPort,
} from '../../domain/ports/tracking-event-dispatcher.port';
import type { TrackingProviderRepositoryPort } from '../../domain/ports/tracking-provider.repository.port';
import {
  TRACKING_EVENT_DISPATCHER,
  TRACKING_EVENT_REPOSITORY,
  TRACKING_PROVIDER_REPOSITORY,
} from '../../tracking.constants';

export interface TestTrackingEventInput {
  providerId: string;
  eventName: string;
  payload?: Record<string, unknown>;
  actorUserId: string;
  ipAddress: string | null;
}

/** "Debug Console" (033 §6) — envía un evento de prueba a un proveedor específico sin pasar por deduplicación ni por la verificación de consentimiento (es una acción explícita del administrador, no tráfico real de un visitante), y siempre queda registrado con `source: "admin-test"`. */
@Injectable()
export class TestTrackingEventUseCase {
  constructor(
    @Inject(TRACKING_PROVIDER_REPOSITORY)
    private readonly providers: TrackingProviderRepositoryPort,
    @Inject(TRACKING_EVENT_REPOSITORY) private readonly events: TrackingEventRepositoryPort,
    @Inject(TRACKING_EVENT_DISPATCHER) private readonly dispatcher: TrackingEventDispatcherPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: TestTrackingEventInput): Promise<DispatchTrackingEventResult> {
    const provider = await this.providers.findById(input.providerId);
    if (!provider) throw new TrackingProviderNotFoundError();

    const payload = input.payload ?? {};
    const result = await this.dispatcher.dispatch({
      provider,
      eventName: input.eventName,
      payload,
    });

    await this.events.create({
      eventName: input.eventName,
      source: 'admin-test',
      payload,
      consentRequired: false,
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'tracking.event_tested',
      ipAddress: input.ipAddress,
      metadata: { providerId: input.providerId, eventName: input.eventName },
    });

    return result;
  }
}
