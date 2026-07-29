import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../../redis/redis.service';
import type { TrendingTerm } from '../../domain/ports/search-query-log.repository.port';
import { TRENDING_CACHE_KEY, TRENDING_CACHE_TTL_SECONDS } from '../../search.constants';

/** Cache-aside simple para "trending" (spec §9) — no necesita ser en tiempo real, un TTL corto evita recalcular el `groupBy` en cada request. */
@Injectable()
export class SearchCacheService {
  constructor(private readonly redis: RedisService) {}

  async getTrending(): Promise<TrendingTerm[] | null> {
    const raw = await this.redis.client.get(TRENDING_CACHE_KEY);
    return raw ? (JSON.parse(raw) as TrendingTerm[]) : null;
  }

  async setTrending(terms: TrendingTerm[]): Promise<void> {
    await this.redis.client.setex(
      TRENDING_CACHE_KEY,
      TRENDING_CACHE_TTL_SECONDS,
      JSON.stringify(terms),
    );
  }
}
