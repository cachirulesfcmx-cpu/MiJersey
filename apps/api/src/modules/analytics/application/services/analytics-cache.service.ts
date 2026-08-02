import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../../redis/redis.service';
import { ANALYTICS_CACHE_TTL_SECONDS } from '../../analytics.constants';

/** Caché de reportes con TTL (spec §8 "caché de consultas") — a diferencia de `ThemeCacheService`/`SiteConfigCacheService`/`EmailTemplateCacheService` (sin TTL, un único escritor explícito por clave), aquí no hay un evento de "publicación" que reseedee la caché: los reportes resumen pedidos reales que cambian continuamente, así que expiran por tiempo — mismo criterio que `TaxonomyCacheService`/`CmsCacheService` (006/026). */
@Injectable()
export class AnalyticsCacheService {
  constructor(private readonly redis: RedisService) {}

  async get(key: string): Promise<string | null> {
    return this.redis.client.get(key);
  }

  async set(key: string, json: string): Promise<void> {
    await this.redis.client.setex(key, ANALYTICS_CACHE_TTL_SECONDS, json);
  }
}
