import type {
  AnalyticsDashboardEntity,
  AnalyticsWidget,
} from '../entities/analytics-dashboard.entity';
import type { AnalyticsDashboardFilters } from '../entities/analytics-dashboard.entity';

export interface UpsertAnalyticsDashboardData {
  name: string;
  widgets: AnalyticsWidget[];
  filters?: AnalyticsDashboardFilters | null;
}

export interface AnalyticsDashboardRepositoryPort {
  findById(id: string): Promise<AnalyticsDashboardEntity | null>;
  findMany(): Promise<AnalyticsDashboardEntity[]>;
  create(data: UpsertAnalyticsDashboardData): Promise<AnalyticsDashboardEntity>;
  update(
    id: string,
    data: Partial<UpsertAnalyticsDashboardData>,
  ): Promise<AnalyticsDashboardEntity>;
  delete(id: string): Promise<void>;
}
