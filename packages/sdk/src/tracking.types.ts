export type TrackingProviderType =
  'GOOGLE_ANALYTICS_4' | 'GOOGLE_TAG_MANAGER' | 'META_PIXEL' | 'TIKTOK_PIXEL' | 'CONVERSION_API';

export type TrackingProviderStatus = 'ACTIVE' | 'INACTIVE';

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

export interface TrackingProvider {
  id: string;
  provider: TrackingProviderType;
  status: TrackingProviderStatus;
  configuration: Record<string, unknown>;
  consentCategory: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicTrackingProvider {
  id: string;
  provider: TrackingProviderType;
  consentCategory: string | null;
  configuration: Record<string, unknown>;
}

export interface CreateTrackingProviderInput {
  provider: TrackingProviderType;
  status?: TrackingProviderStatus;
  configuration: Record<string, unknown>;
  consentCategory?: string | null;
}

export interface UpdateTrackingProviderInput {
  status?: TrackingProviderStatus;
  configuration?: Record<string, unknown>;
  consentCategory?: string | null;
}

export interface TrackingEvent {
  id: string;
  eventName: string;
  source: string;
  payload: Record<string, unknown>;
  consentRequired: boolean;
  createdAt: string;
}

export interface ListTrackingEventsParams {
  page?: number;
  pageSize?: number;
  eventName?: string;
  source?: string;
  from?: string;
  to?: string;
}

export interface TestTrackingEventInput {
  providerId: string;
  eventName: string;
  payload?: Record<string, unknown>;
}

export interface TestTrackingEventResult {
  delivered: boolean;
  raw: Record<string, unknown>;
}

export interface TrackingConsentCategories {
  categories: string[];
}
