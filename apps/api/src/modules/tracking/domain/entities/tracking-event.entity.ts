export interface TrackingEventProps {
  id: string;
  eventName: string;
  source: string;
  payload: Record<string, unknown>;
  consentRequired: boolean;
  createdAt: Date;
}

export class TrackingEventEntity {
  constructor(private readonly props: TrackingEventProps) {}

  toJSON(): TrackingEventProps {
    return { ...this.props };
  }
}
