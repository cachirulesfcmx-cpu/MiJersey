export interface AnalyticsWidget {
  id: string;
  type: 'sales' | 'customers' | 'products' | 'events' | 'kpi';
  title: string;
  config: Record<string, unknown>;
}

export interface AnalyticsDashboardFilters {
  from?: string;
  to?: string;
  channel?: string;
  segment?: string;
}

export interface AnalyticsDashboardProps {
  id: string;
  name: string;
  widgets: AnalyticsWidget[];
  filters: AnalyticsDashboardFilters | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AnalyticsDashboardEntity {
  constructor(private readonly props: AnalyticsDashboardProps) {}

  get id(): string {
    return this.props.id;
  }

  toJSON(): AnalyticsDashboardProps {
    return { ...this.props };
  }
}
