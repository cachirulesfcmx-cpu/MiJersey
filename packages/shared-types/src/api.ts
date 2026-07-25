/** Uniform error shape returned by every API endpoint. */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type HealthStatus = 'ok' | 'degraded' | 'down';

export interface HealthCheckResult {
  status: HealthStatus;
  checks: Record<string, { status: HealthStatus; message?: string }>;
  timestamp: string;
}
