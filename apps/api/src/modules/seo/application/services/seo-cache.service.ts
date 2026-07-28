import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../../redis/redis.service';
import { SITEMAP_CACHE_KEY, SITEMAP_CACHE_TTL_SECONDS } from '../../seo.constants';

/** Cache-aside simple para el sitemap (spec §9): TTL fijo, sin invalidación por evento — el catálogo cambia con más frecuencia de la que vale la pena instrumentar cada escritura. */
@Injectable()
export class SeoCacheService {
  constructor(private readonly redis: RedisService) {}

  getSitemap(): Promise<string | null> {
    return this.redis.client.get(SITEMAP_CACHE_KEY);
  }

  async setSitemap(xml: string): Promise<void> {
    await this.redis.client.setex(SITEMAP_CACHE_KEY, SITEMAP_CACHE_TTL_SECONDS, xml);
  }
}
