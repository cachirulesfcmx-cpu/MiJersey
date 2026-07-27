import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../../redis/redis.service';
import { PUBLIC_CACHE_TTL_SECONDS } from '../../attributes.constants';

/** Solo se cachea la consulta de facetas sin ningún filtro aplicado; cualquier combinación de filtros no pasa por caché (mismo criterio conservador que Taxonomy en 006). */
const DEFAULT_FACETS_KEY = 'attributes:public:filters:default';

@Injectable()
export class AttributeCacheService {
  constructor(private readonly redis: RedisService) {}

  async getDefaultFacets(): Promise<string | null> {
    return this.redis.client.get(DEFAULT_FACETS_KEY);
  }

  async setDefaultFacets(json: string): Promise<void> {
    await this.redis.client.setex(DEFAULT_FACETS_KEY, PUBLIC_CACHE_TTL_SECONDS, json);
  }

  async invalidateDefaultFacets(): Promise<void> {
    await this.redis.client.del(DEFAULT_FACETS_KEY);
  }
}
