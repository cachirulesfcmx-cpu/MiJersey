import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../../redis/redis.service';
import { PUBLIC_CACHE_TTL_SECONDS } from '../../blog.constants';

function postCacheKey(slug: string): string {
  return `blog:public:post:${slug}`;
}

/** Cache-aside en Redis para artículos publicados — mismo criterio que `CmsCacheService` (026) y `TaxonomyCacheService` (006). */
@Injectable()
export class BlogCacheService {
  constructor(private readonly redis: RedisService) {}

  async getPost(slug: string): Promise<string | null> {
    return this.redis.client.get(postCacheKey(slug));
  }

  async setPost(slug: string, json: string): Promise<void> {
    await this.redis.client.setex(postCacheKey(slug), PUBLIC_CACHE_TTL_SECONDS, json);
  }

  async invalidatePost(slug: string): Promise<void> {
    await this.redis.client.del(postCacheKey(slug));
  }
}
