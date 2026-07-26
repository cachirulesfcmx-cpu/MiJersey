import type { RoleName, UserProfile } from './auth.types.js';

export type StaffMember = UserProfile;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: RoleName;
}

export interface CreateStaffUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: RoleName;
}

export interface RoleSummary {
  name: RoleName;
  description: string | null;
  permissions: string[];
}

export interface MetricValue {
  value: number;
  available: boolean;
}

export interface DashboardMetrics {
  customers: MetricValue;
  staff: MetricValue;
  activeUsers: MetricValue;
  sales: MetricValue;
  orders: MetricValue;
  products: MetricValue;
  revenue: MetricValue;
  conversionRate: MetricValue;
  inventoryAlerts: MetricValue;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface QueryAuditLogParams {
  page?: number;
  pageSize?: number;
  action?: string;
  userId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileInput {
  firstName: string;
  lastName: string;
}
