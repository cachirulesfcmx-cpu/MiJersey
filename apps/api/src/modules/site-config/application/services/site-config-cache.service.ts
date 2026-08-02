import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../../redis/redis.service';
import { SITE_CONFIGURATION_CACHE_KEY } from '../../site-config.constants';

/** Caché de la configuración activa — sin TTL, invalidada/repoblada solo por `UpdateSiteConfigurationUseCase` (spec §8 "invalidación automática tras cambios"); ver `site-config.constants.ts` para el razonamiento completo (mismo criterio que `ThemeCacheService`, 029). */
@Injectable()
export class SiteConfigCacheService {
  constructor(private readonly redis: RedisService) {}

  async get(): Promise<string | null> {
    return this.redis.client.get(SITE_CONFIGURATION_CACHE_KEY);
  }

  async set(json: string): Promise<void> {
    await this.redis.client.set(SITE_CONFIGURATION_CACHE_KEY, json);
  }

  async invalidate(): Promise<void> {
    await this.redis.client.del(SITE_CONFIGURATION_CACHE_KEY);
  }
}
