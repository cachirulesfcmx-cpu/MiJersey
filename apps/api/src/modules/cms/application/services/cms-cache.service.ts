import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../../redis/redis.service';
import { PUBLIC_CACHE_TTL_SECONDS } from '../../cms.constants';

function pageCacheKey(slug: string): string {
  return `cms:public:page:${slug}`;
}

/** Cache-aside en Redis para páginas publicadas (026 §8). Cada escritura relevante (crear, actualizar, publicar, eliminar, restaurar) invalida la clave del slug afectado; el próximo GET público recalcula y vuelve a poblar la caché — mismo criterio que `TaxonomyCacheService` (006). */
@Injectable()
export class CmsCacheService {
  constructor(private readonly redis: RedisService) {}

  async getPage(slug: string): Promise<string | null> {
    return this.redis.client.get(pageCacheKey(slug));
  }

  async setPage(slug: string, json: string): Promise<void> {
    await this.redis.client.setex(pageCacheKey(slug), PUBLIC_CACHE_TTL_SECONDS, json);
  }

  async invalidatePage(slug: string): Promise<void> {
    await this.redis.client.del(pageCacheKey(slug));
  }
}
