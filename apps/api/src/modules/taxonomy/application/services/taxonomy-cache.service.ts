import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../../redis/redis.service';
import { PUBLIC_CACHE_TTL_SECONDS } from '../../taxonomy.constants';

const CATEGORY_TREE_KEY = 'taxonomy:public:category-tree';
/** Solo se cachea la consulta pública por defecto (sin búsqueda, primera página); el resto no pasa por caché. */
const DEFAULT_COLLECTIONS_LIST_KEY = 'taxonomy:public:collections:default';

/**
 * Cache-aside en Redis para la navegación pública (09-Rendimiento del spec
 * 006). Cada escritura relevante invalida la clave correspondiente; el
 * próximo GET público recalcula y vuelve a poblar la caché.
 */
@Injectable()
export class TaxonomyCacheService {
  constructor(private readonly redis: RedisService) {}

  async getCategoryTree(): Promise<string | null> {
    return this.redis.client.get(CATEGORY_TREE_KEY);
  }

  async setCategoryTree(json: string): Promise<void> {
    await this.redis.client.setex(CATEGORY_TREE_KEY, PUBLIC_CACHE_TTL_SECONDS, json);
  }

  async invalidateCategoryTree(): Promise<void> {
    await this.redis.client.del(CATEGORY_TREE_KEY);
  }

  async getDefaultCollectionsList(): Promise<string | null> {
    return this.redis.client.get(DEFAULT_COLLECTIONS_LIST_KEY);
  }

  async setDefaultCollectionsList(json: string): Promise<void> {
    await this.redis.client.setex(DEFAULT_COLLECTIONS_LIST_KEY, PUBLIC_CACHE_TTL_SECONDS, json);
  }

  async invalidateCollectionsList(): Promise<void> {
    await this.redis.client.del(DEFAULT_COLLECTIONS_LIST_KEY);
  }
}
