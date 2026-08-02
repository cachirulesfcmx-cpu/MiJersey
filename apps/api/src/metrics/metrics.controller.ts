import { Controller, Get, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';

import { Public } from '../common/decorators/public.decorator';
import { MetricsService } from './metrics.service';

/**
 * Sin protección por permisos (igual que `/health`): en producción real esto
 * debe restringirse a la red interna a nivel de proxy/ingress (ver
 * infra/nginx/nginx.conf), no exigir un JWT — Prometheus no envía bearer
 * tokens. Documentado en docs/production-hardening.md.
 *
 * `@SkipThrottle()`: mismo motivo que `HealthController` — un scraper de
 * Prometheus real sondea cada 10-15s y no debería competir por la misma
 * cuota de 100 req/min que el resto de la API.
 */
@SkipThrottle()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Public()
  @Get()
  async getMetrics(@Res() res: Response): Promise<void> {
    res.setHeader('Content-Type', this.metrics.contentType);
    res.send(await this.metrics.getMetrics());
  }
}
