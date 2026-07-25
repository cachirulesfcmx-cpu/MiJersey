import type { ApiErrorResponse, HealthCheckResult } from '@mijersey/shared-types';

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

/**
 * Thin, typed wrapper around the MiJersey API. Endpoint-specific methods are
 * added by later modules as domain APIs are implemented; this bootstrap only
 * ships the transport and the health check.
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
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

    return (await response.json()) as T;
  }

  getHealth(): Promise<HealthCheckResult> {
    return this.request<HealthCheckResult>('/health');
  }
}
