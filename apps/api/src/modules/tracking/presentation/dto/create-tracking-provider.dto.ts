import { IsIn, IsObject, IsOptional } from 'class-validator';

import {
  CONSENT_CATEGORIES,
  TRACKING_PROVIDER_STATUSES,
  TRACKING_PROVIDER_TYPES,
  type TrackingProviderStatus,
  type TrackingProviderType,
} from '../../domain/value-objects/tracking-provider-enums';

export class CreateTrackingProviderDto {
  @IsIn(TRACKING_PROVIDER_TYPES)
  provider!: TrackingProviderType;

  @IsOptional()
  @IsIn(TRACKING_PROVIDER_STATUSES)
  status?: TrackingProviderStatus;

  @IsObject()
  configuration!: Record<string, unknown>;

  @IsOptional()
  @IsIn(CONSENT_CATEGORIES)
  consentCategory?: string | null;
}
