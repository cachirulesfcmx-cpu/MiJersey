import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../../redis/redis.service';
import { PUBLIC_CACHE_TTL_SECONDS } from '../../navigation.constants';

function menuCacheKey(location: string): string {
  return `navigation:public:render:${location}`;
}

/** Cache-aside en Redis del árbol ya resuelto (rutas de recursos dinámicos calculadas) por ubicación — mismo criterio que `BlogCacheService` (027) y `CmsCacheService` (026). La visibilidad por contexto se filtra después de leer la caché, no antes, para no fragmentar la clave por contexto (spec §8 "invalidación automática tras cambios"). */
@Injectable()
export class NavigationCacheService {
  constructor(private readonly redis: RedisService) {}

  async getRenderedMenu(location: string): Promise<string | null> {
    return this.redis.client.get(menuCacheKey(location));
  }

  async setRenderedMenu(location: string, json: string): Promise<void> {
    await this.redis.client.setex(menuCacheKey(location), PUBLIC_CACHE_TTL_SECONDS, json);
  }

  async invalidateLocation(location: string): Promise<void> {
    await this.redis.client.del(menuCacheKey(location));
  }
}
