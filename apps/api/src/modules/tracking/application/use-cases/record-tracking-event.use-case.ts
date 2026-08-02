import { Inject, Injectable } from '@nestjs/common';

import type { TrackingEventEntity } from '../../domain/entities/tracking-event.entity';
import type { TrackingEventRepositoryPort } from '../../domain/ports/tracking-event.repository.port';
import type { TrackingEventDispatcherPort } from '../../domain/ports/tracking-event-dispatcher.port';
import type { TrackingProviderRepositoryPort } from '../../domain/ports/tracking-provider.repository.port';
import {
  TRACKING_EVENT_DISPATCHER,
  TRACKING_EVENT_REPOSITORY,
  TRACKING_PROVIDER_REPOSITORY,
} from '../../tracking.constants';
import { TrackingDedupService } from '../services/tracking-dedup.service';

export interface RecordTrackingEventInput {
  eventName: string;
  source: string;
  payload: Record<string, unknown>;
  consentRequired?: boolean;
  /** Categorías de consentimiento ya otorgadas por el visitante (desde su cookie de consentimiento) — sin productores todavía invocando este caso de uso, por defecto no se otorga ninguna. */
  grantedConsentCategories?: string[];
}

/** Colector de eventos de negocio (033 §5 "despachador de eventos") — pensado para invocarse en proceso desde futuros productores (013 Home, 018 Checkout, 022 Payments) sin pasar por HTTP. Descarta duplicados dentro de la ventana de deduplicación (spec §4/§8) antes de crear la fila; siempre registra el evento (para el Debug Console) pero solo lo despacha a los proveedores activos cuya categoría de consentimiento fue otorgada. */
@Injectable()
export class RecordTrackingEventUseCase {
  constructor(
    @Inject(TRACKING_EVENT_REPOSITORY) private readonly events: TrackingEventRepositoryPort,
    @Inject(TRACKING_PROVIDER_REPOSITORY)
    private readonly providers: TrackingProviderRepositoryPort,
    @Inject(TRACKING_EVENT_DISPATCHER) private readonly dispatcher: TrackingEventDispatcherPort,
    private readonly dedup: TrackingDedupService,
  ) {}

  async execute(input: RecordTrackingEventInput): Promise<TrackingEventEntity | null> {
    const isDuplicate = await this.dedup.isDuplicate(input.eventName, input.source, input.payload);
    if (isDuplicate) return null;

    const consentRequired = input.consentRequired ?? false;
    const granted = new Set(input.grantedConsentCategories ?? []);

    const event = await this.events.create({
      eventName: input.eventName,
      source: input.source,
      payload: input.payload,
      consentRequired,
    });

    const activeProviders = await this.providers.findActive();
    const eligibleProviders = activeProviders.filter(
      (provider) =>
        !provider.consentCategory ||
        provider.consentCategory === 'necessary' ||
        granted.has(provider.consentCategory),
    );

    await Promise.all(
      eligibleProviders.map((provider) =>
        this.dispatcher.dispatch({ provider, eventName: input.eventName, payload: input.payload }),
      ),
    );

    return event;
  }
}
