import type { PaginatedResult } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type { TrackingEventEntity } from '../../domain/entities/tracking-event.entity';
import type {
  ListTrackingEventsParams,
  TrackingEventRepositoryPort,
} from '../../domain/ports/tracking-event.repository.port';
import { TRACKING_EVENT_REPOSITORY } from '../../tracking.constants';

@Injectable()
export class ListTrackingEventsUseCase {
  constructor(
    @Inject(TRACKING_EVENT_REPOSITORY) private readonly events: TrackingEventRepositoryPort,
  ) {}

  async execute(params: ListTrackingEventsParams): Promise<PaginatedResult<TrackingEventEntity>> {
    return this.events.findMany(params);
  }
}
