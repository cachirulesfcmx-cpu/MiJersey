import { Inject, Injectable } from '@nestjs/common';

import { ANALYTICS_EVENT_REPOSITORY } from '../../analytics.constants';
import type { AnalyticsEventEntity } from '../../domain/entities/analytics-event.entity';
import type {
  AnalyticsEventRepositoryPort,
  CreateAnalyticsEventData,
} from '../../domain/ports/analytics-event.repository.port';

/** "Colector de eventos" (spec §5) — pensado para invocarse en proceso desde otros módulos (021 Orders, 024 Promotions, 027 Blog, 033 Tracking) inyectando este caso de uso, sin pasar por HTTP; también se expone en `POST /admin/analytics/events` para pruebas y para cualquier productor externo. No se audita cada evento individual (serían miles) — la auditoría del módulo (spec §10) se reserva para exportaciones y cambios de dashboards, spec §10 "accesos administrativos" ya queda cubierto por `PermissionsGuard`. */
@Injectable()
export class RecordAnalyticsEventUseCase {
  constructor(
    @Inject(ANALYTICS_EVENT_REPOSITORY) private readonly events: AnalyticsEventRepositoryPort,
  ) {}

  async execute(data: CreateAnalyticsEventData): Promise<AnalyticsEventEntity> {
    return this.events.create(data);
  }
}
