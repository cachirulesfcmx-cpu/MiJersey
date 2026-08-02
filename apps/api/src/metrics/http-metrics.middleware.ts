import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { MetricsService } from './metrics.service';

/**
 * Usa el patrón de ruta (`req.route.path`), no la URL cruda — de lo contrario
 * cada id de recurso (`/admin/products/:id`) generaría una serie de tiempo
 * distinta y la cardinalidad de métricas crecería sin límite.
 */
@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const routePath = req.route?.path as string | undefined;
      const route = routePath ? `${req.baseUrl}${routePath}` : 'unmatched';
      const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
      this.metrics.observeHttpRequest(req.method, route, res.statusCode, durationSeconds);
    });

    next();
  }
}
