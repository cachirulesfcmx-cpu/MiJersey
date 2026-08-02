import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { AnalyticsEventEntity } from '../entities/analytics-event.entity';

export interface CreateAnalyticsEventData {
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
}

export interface ListAnalyticsEventsParams extends PaginationParams {
  eventType?: string;
  entityType?: string;
  from?: Date;
  to?: Date;
}

export interface AnalyticsEventRepositoryPort {
  create(data: CreateAnalyticsEventData): Promise<AnalyticsEventEntity>;
  findMany(params: ListAnalyticsEventsParams): Promise<PaginatedResult<AnalyticsEventEntity>>;
}
