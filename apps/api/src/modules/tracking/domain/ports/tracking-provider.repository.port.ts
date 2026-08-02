import type { TrackingProviderEntity } from '../entities/tracking-provider.entity';
import type {
  TrackingProviderStatus,
  TrackingProviderType,
} from '../value-objects/tracking-provider-enums';

export interface UpsertTrackingProviderData {
  status: TrackingProviderStatus;
  configuration: Record<string, unknown>;
  consentCategory: string | null;
}

export interface TrackingProviderRepositoryPort {
  findById(id: string): Promise<TrackingProviderEntity | null>;
  findByProvider(provider: TrackingProviderType): Promise<TrackingProviderEntity | null>;
  findMany(): Promise<TrackingProviderEntity[]>;
  findActive(): Promise<TrackingProviderEntity[]>;
  create(
    provider: TrackingProviderType,
    data: UpsertTrackingProviderData,
  ): Promise<TrackingProviderEntity>;
  update(id: string, data: Partial<UpsertTrackingProviderData>): Promise<TrackingProviderEntity>;
  delete(id: string): Promise<void>;
}
