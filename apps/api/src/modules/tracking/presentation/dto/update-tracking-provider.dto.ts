import { IsIn, IsObject, IsOptional } from 'class-validator';

import {
  CONSENT_CATEGORIES,
  TRACKING_PROVIDER_STATUSES,
  type TrackingProviderStatus,
} from '../../domain/value-objects/tracking-provider-enums';

export class UpdateTrackingProviderDto {
  @IsOptional()
  @IsIn(TRACKING_PROVIDER_STATUSES)
  status?: TrackingProviderStatus;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;

  @IsOptional()
  @IsIn(CONSENT_CATEGORIES)
  consentCategory?: string | null;
}
