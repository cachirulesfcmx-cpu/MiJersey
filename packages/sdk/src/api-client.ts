import type { ApiErrorResponse, HealthCheckResult } from '@mijersey/shared-types';

import type {
  AuthSession,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  SessionSummary,
  UserProfile,
} from './auth.types.js';

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

/**
 * Thin, typed wrapper around the MiJersey API. Endpoint-specific methods are
 * added as domain APIs are implemented.
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
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

  me(accessToken: string): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me', { accessToken });
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
}
