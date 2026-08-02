import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { TrackingEventEntity } from '../entities/tracking-event.entity';

export interface CreateTrackingEventData {
  eventName: string;
  source: string;
  payload: Record<string, unknown>;
  consentRequired: boolean;
}

export interface ListTrackingEventsParams extends PaginationParams {
  eventName?: string;
  source?: string;
  from?: Date;
  to?: Date;
}

export interface TrackingEventRepositoryPort {
  create(data: CreateTrackingEventData): Promise<TrackingEventEntity>;
  findMany(params: ListTrackingEventsParams): Promise<PaginatedResult<TrackingEventEntity>>;
}
