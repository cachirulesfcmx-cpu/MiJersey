export interface DateRangeParams {
  from?: string;
  to?: string;
}

export interface SalesSummary {
  orderCount: number;
  revenue: string;
  averageOrderValue: string;
  currency: string | null;
}

export interface SalesTrendPoint {
  date: string;
  orderCount: number;
  revenue: string;
}

export interface TopCustomer {
  customerId: string;
  email: string;
  name: string;
  orderCount: number;
  totalSpent: string;
}

export interface CustomerInsights {
  newCustomers: number;
  returningCustomers: number;
  topCustomers: TopCustomer[];
}

export interface TopProduct {
  productId: string;
  sku: string;
  name: string;
  unitsSold: number;
  revenue: string;
}

export interface ExecutiveDashboardView {
  range: { from: string; to: string };
  orderCount: number;
  revenue: string;
  averageOrderValue: string;
  currency: string | null;
  newCustomers: number;
  activeProducts: number;
  topProducts: TopProduct[];
}

export interface SalesReportView {
  range: { from: string; to: string };
  summary: SalesSummary;
  trend: SalesTrendPoint[];
}

export type AnalyticsWidgetType = 'sales' | 'customers' | 'products' | 'events' | 'kpi';

export interface AnalyticsWidget {
  id: string;
  type: AnalyticsWidgetType;
  title: string;
  config: Record<string, unknown>;
}

export interface AnalyticsDashboardFilters {
  from?: string;
  to?: string;
  channel?: string;
  segment?: string;
}

export interface AnalyticsDashboard {
  id: string;
  name: string;
  widgets: AnalyticsWidget[];
  filters: AnalyticsDashboardFilters | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnalyticsDashboardInput {
  name: string;
  widgets: AnalyticsWidget[];
  filters?: AnalyticsDashboardFilters;
}

export interface UpdateAnalyticsDashboardInput {
  name?: string;
  widgets?: AnalyticsWidget[];
  filters?: AnalyticsDashboardFilters;
}

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export interface RecordAnalyticsEventInput {
  eventType: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
}

export interface ListAnalyticsEventsParams {
  page?: number;
  pageSize?: number;
  eventType?: string;
  entityType?: string;
  from?: string;
  to?: string;
}

export type ExportReportType = 'sales' | 'customers' | 'products' | 'events';

export interface ExportReportParams extends DateRangeParams {
  type: ExportReportType;
}

export interface ExportReportResult {
  filename: string;
  csv: string;
}
