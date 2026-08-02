import { toPublicConfiguration } from '../value-objects/tracking-configuration.util';
import type {
  TrackingProviderStatus,
  TrackingProviderType,
} from '../value-objects/tracking-provider-enums';

export interface TrackingProviderProps {
  id: string;
  provider: TrackingProviderType;
  status: TrackingProviderStatus;
  configuration: Record<string, unknown>;
  consentCategory: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicTrackingProvider {
  id: string;
  provider: TrackingProviderType;
  consentCategory: string | null;
  configuration: Record<string, unknown>;
}

export class TrackingProviderEntity {
  constructor(private readonly props: TrackingProviderProps) {}

  get id(): string {
    return this.props.id;
  }

  get provider(): TrackingProviderType {
    return this.props.provider;
  }

  get status(): TrackingProviderStatus {
    return this.props.status;
  }

  get consentCategory(): string | null {
    return this.props.consentCategory;
  }

  toJSON(): TrackingProviderProps {
    return { ...this.props };
  }

  toPublicJSON(): PublicTrackingProvider {
    return {
      id: this.props.id,
      provider: this.props.provider,
      consentCategory: this.props.consentCategory,
      configuration: toPublicConfiguration(this.props.provider, this.props.configuration),
    };
  }
}
