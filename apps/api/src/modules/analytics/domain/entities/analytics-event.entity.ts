export interface AnalyticsEventProps {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export class AnalyticsEventEntity {
  constructor(private readonly props: AnalyticsEventProps) {}

  toJSON(): AnalyticsEventProps {
    return { ...this.props };
  }
}
