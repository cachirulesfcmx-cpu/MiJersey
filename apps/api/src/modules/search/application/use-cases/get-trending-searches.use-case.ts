import { Inject, Injectable } from '@nestjs/common';

import type {
  SearchQueryLogRepositoryPort,
  TrendingTerm,
} from '../../domain/ports/search-query-log.repository.port';
import {
  DEFAULT_TRENDING_LIMIT,
  MAX_TRENDING_LIMIT,
  SEARCH_QUERY_LOG_REPOSITORY,
  TRENDING_WINDOW_DAYS,
} from '../../search.constants';
import { SearchCacheService } from '../services/search-cache.service';

@Injectable()
export class GetTrendingSearchesUseCase {
  constructor(
    @Inject(SEARCH_QUERY_LOG_REPOSITORY) private readonly queryLog: SearchQueryLogRepositoryPort,
    private readonly cache: SearchCacheService,
  ) {}

  async execute(limit = DEFAULT_TRENDING_LIMIT): Promise<TrendingTerm[]> {
    const cached = await this.cache.getTrending();
    if (cached) return cached.slice(0, limit);

    const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const trending = await this.queryLog.findTrending(since, MAX_TRENDING_LIMIT);
    await this.cache.setTrending(trending);
    return trending.slice(0, limit);
  }
}
