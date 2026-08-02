import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

/**
 * Registro Prometheus del proceso (035 §4 "Métricas"). `collectDefaultMetrics`
 * aporta CPU/memoria/event-loop-lag/handles activos sin instrumentación manual;
 * las métricas HTTP (duración, conteo por código de estado) se alimentan desde
 * `HttpMetricsMiddleware`, que se registra una sola vez para toda la app.
 */
@Injectable()
export class MetricsService implements OnModuleDestroy {
  readonly registry = new Registry();

  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duración de requests HTTP en segundos',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [this.registry],
  });

  private readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total de requests HTTP procesados',
    labelNames: ['method', 'route', 'status_code'],
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  observeHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const labels = { method, route, status_code: String(statusCode) };
    this.httpRequestDuration.observe(labels, durationSeconds);
    this.httpRequestsTotal.inc(labels);
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  onModuleDestroy(): void {
    this.registry.clear();
  }
}
