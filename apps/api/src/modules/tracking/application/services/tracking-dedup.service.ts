import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../../redis/redis.service';
import { TRACKING_DEDUP_WINDOW_SECONDS } from '../../tracking.constants';

/** Deduplicación de eventos (033 §4/§8) vía `SET NX` con TTL corto en Redis — un mismo evento (nombre+origen+payload) enviado dos veces dentro de la ventana se descarta en el segundo intento. No usa un TTL largo ni una tabla propia: el objetivo es absorber reintentos/doble disparo del cliente, no un histórico de deduplicación. */
@Injectable()
export class TrackingDedupService {
  constructor(private readonly redis: RedisService) {}

  async isDuplicate(
    eventName: string,
    source: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    const hash = createHash('sha256')
      .update(`${eventName}|${source}|${JSON.stringify(payload)}`)
      .digest('hex');
    const key = `tracking:dedup:${hash}`;

    const result = await this.redis.client.set(key, '1', 'EX', TRACKING_DEDUP_WINDOW_SECONDS, 'NX');
    return result === null;
  }
}
