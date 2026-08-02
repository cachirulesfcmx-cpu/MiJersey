import type { PaginatedResult } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import { ANALYTICS_EVENT_REPOSITORY } from '../../analytics.constants';
import type { AnalyticsEventEntity } from '../../domain/entities/analytics-event.entity';
import type {
  AnalyticsEventRepositoryPort,
  ListAnalyticsEventsParams,
} from '../../domain/ports/analytics-event.repository.port';

@Injectable()
export class ListAnalyticsEventsUseCase {
  constructor(
    @Inject(ANALYTICS_EVENT_REPOSITORY) private readonly events: AnalyticsEventRepositoryPort,
  ) {}

  async execute(params: ListAnalyticsEventsParams): Promise<PaginatedResult<AnalyticsEventEntity>> {
    return this.events.findMany(params);
  }
}
