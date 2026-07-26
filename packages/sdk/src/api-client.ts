import type { ApiErrorResponse, HealthCheckResult } from '@mijersey/shared-types';

import type {
  AuditLogEntry,
  ChangePasswordInput,
  CreateStaffUserInput,
  DashboardMetrics,
  ListUsersParams,
  PaginatedResult,
  QueryAuditLogParams,
  RoleSummary,
  StaffMember,
  UpdateProfileInput,
} from './admin.types.js';
import type {
  AuthenticatedUser,
  AuthSession,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  RoleName,
  SessionSummary,
  UserProfile,
} from './auth.types.js';
import type {
  CreateProductInput,
  ListProductsParams,
  ListPublicProductsParams,
  Product,
  ProductStatus,
  UpdateProductInput,
} from './catalog.types.js';

const HTTP_NO_CONTENT = 204;

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export interface ApiClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export interface ApiRequestOptions extends RequestInit {
  accessToken?: string;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

/**
 * Thin, typed wrapper around the MiJersey API. Endpoint-specific methods are
 * added as domain APIs are implemented.
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    // `fetch` es un método de Window: si se invoca como `this.fetchImpl(...)` sin
    // enlazar, el receptor cambia y los navegadores lanzan "Illegal invocation".
    this.fetchImpl = options.fetchImpl ?? fetch.bind(globalThis);
  }

  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const { accessToken, headers, ...rest } = options;

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...rest,
      // Necesario para que el refresh token (cookie httpOnly) viaje entre
      // el origen del frontend y el de la API.
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiErrorResponse | null;
      throw new ApiClientError(
        body?.error.message ?? response.statusText,
        response.status,
        body?.error.code ?? 'UNKNOWN_ERROR',
        body?.error.requestId,
      );
    }

    if (response.status === HTTP_NO_CONTENT) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  getHealth(): Promise<HealthCheckResult> {
    return this.request<HealthCheckResult>('/health');
  }

  register(input: RegisterInput): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  login(input: LoginInput): Promise<AuthSession> {
    return this.request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  refresh(): Promise<AuthSession> {
    return this.request<AuthSession>('/auth/refresh', { method: 'POST' });
  }

  logout(accessToken: string): Promise<void> {
    return this.request<void>('/auth/logout', { method: 'POST', accessToken });
  }

  forgotPassword(email: string): Promise<void> {
    return this.request<void>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  resetPassword(input: ResetPasswordInput): Promise<void> {
    return this.request<void>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  changePassword(accessToken: string, input: ChangePasswordInput): Promise<void> {
    return this.request<void>('/auth/change-password', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  verifyEmail(token: string): Promise<void> {
    return this.request<void>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  resendVerification(email: string): Promise<void> {
    return this.request<void>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  me(accessToken: string): Promise<AuthenticatedUser> {
    return this.request<AuthenticatedUser>('/auth/me', { accessToken });
  }

  updateProfile(accessToken: string, input: UpdateProfileInput): Promise<AuthenticatedUser> {
    return this.request<AuthenticatedUser>('/auth/profile', {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  listSessions(accessToken: string): Promise<SessionSummary[]> {
    return this.request<SessionSummary[]>('/sessions', { accessToken });
  }

  revokeSession(accessToken: string, sessionId: string): Promise<void> {
    return this.request<void>(`/sessions/${sessionId}`, { method: 'DELETE', accessToken });
  }

  revokeAllSessions(accessToken: string): Promise<void> {
    return this.request<void>('/sessions', { method: 'DELETE', accessToken });
  }

  listStaffUsers(
    accessToken: string,
    params: ListUsersParams = {},
  ): Promise<PaginatedResult<StaffMember>> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      role: params.role,
    });
    return this.request<PaginatedResult<StaffMember>>(`/admin/users${query}`, { accessToken });
  }

  createStaffUser(accessToken: string, input: CreateStaffUserInput): Promise<StaffMember> {
    return this.request<StaffMember>('/admin/users', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  updateStaffUserRole(accessToken: string, userId: string, role: RoleName): Promise<void> {
    return this.request<void>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ role }),
    });
  }

  setStaffUserActive(accessToken: string, userId: string, isActive: boolean): Promise<void> {
    return this.request<void>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ isActive }),
    });
  }

  listRoles(accessToken: string): Promise<RoleSummary[]> {
    return this.request<RoleSummary[]>('/admin/roles', { accessToken });
  }

  getDashboardMetrics(accessToken: string): Promise<DashboardMetrics> {
    return this.request<DashboardMetrics>('/admin/dashboard/metrics', { accessToken });
  }

  getRecentActivity(accessToken: string): Promise<AuditLogEntry[]> {
    return this.request<AuditLogEntry[]>('/admin/dashboard/activity', { accessToken });
  }

  queryAuditLog(
    accessToken: string,
    params: QueryAuditLogParams = {},
  ): Promise<PaginatedResult<AuditLogEntry>> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      action: params.action,
      userId: params.userId,
      fromDate: params.fromDate,
      toDate: params.toDate,
    });
    return this.request<PaginatedResult<AuditLogEntry>>(`/admin/audit-log${query}`, {
      accessToken,
    });
  }

  listProducts(
    accessToken: string,
    params: ListProductsParams = {},
  ): Promise<PaginatedResult<Product>> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      status: params.status,
      visibility: params.visibility,
      type: params.type,
      sortBy: params.sortBy,
      sortDir: params.sortDir,
    });
    return this.request<PaginatedResult<Product>>(`/admin/products${query}`, { accessToken });
  }

  getProduct(accessToken: string, id: string): Promise<Product> {
    return this.request<Product>(`/admin/products/${id}`, { accessToken });
  }

  createProduct(accessToken: string, input: CreateProductInput): Promise<Product> {
    return this.request<Product>('/admin/products', {
      method: 'POST',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  updateProduct(accessToken: string, id: string, input: UpdateProductInput): Promise<Product> {
    return this.request<Product>(`/admin/products/${id}`, {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify(input),
    });
  }

  publishProduct(accessToken: string, id: string): Promise<void> {
    return this.request<void>(`/admin/products/${id}/publish`, { method: 'PATCH', accessToken });
  }

  archiveProduct(accessToken: string, id: string): Promise<void> {
    return this.request<void>(`/admin/products/${id}/archive`, { method: 'PATCH', accessToken });
  }

  duplicateProduct(accessToken: string, id: string): Promise<Product> {
    return this.request<Product>(`/admin/products/${id}/duplicate`, {
      method: 'POST',
      accessToken,
    });
  }

  deleteProduct(accessToken: string, id: string): Promise<void> {
    return this.request<void>(`/admin/products/${id}`, { method: 'DELETE', accessToken });
  }

  bulkUpdateProductStatus(
    accessToken: string,
    ids: string[],
    status: ProductStatus,
  ): Promise<void> {
    return this.request<void>('/admin/products/bulk/status', {
      method: 'PATCH',
      accessToken,
      body: JSON.stringify({ ids, status }),
    });
  }

  bulkDeleteProducts(accessToken: string, ids: string[]): Promise<void> {
    return this.request<void>('/admin/products/bulk/delete', {
      method: 'POST',
      accessToken,
      body: JSON.stringify({ ids }),
    });
  }

  listPublicProducts(params: ListPublicProductsParams = {}): Promise<PaginatedResult<Product>> {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
    });
    return this.request<PaginatedResult<Product>>(`/products${query}`);
  }

  getPublicProduct(slug: string): Promise<Product> {
    return this.request<Product>(`/products/${slug}`);
  }
}
