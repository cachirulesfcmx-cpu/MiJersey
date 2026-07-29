import { Inject, Injectable } from '@nestjs/common';

import type {
  SearchQueryLogRepositoryPort,
  TrendingTerm,
} from '../../domain/ports/search-query-log.repository.port';
import {
  SEARCH_QUERY_LOG_REPOSITORY,
  TRENDING_WINDOW_DAYS,
  ZERO_RESULT_WINDOW_DAYS,
} from '../../search.constants';

export interface SearchAnalytics {
  topTerms: TrendingTerm[];
  zeroResultTerms: TrendingTerm[];
}

/** Métricas básicas para el admin (spec §9): términos más buscados y búsquedas sin resultados. Un panel completo con clics/conversiones llega con 032-Analytics. */
@Injectable()
export class GetSearchAnalyticsUseCase {
  constructor(
    @Inject(SEARCH_QUERY_LOG_REPOSITORY) private readonly queryLog: SearchQueryLogRepositoryPort,
  ) {}

  async execute(): Promise<SearchAnalytics> {
    const topSince = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const zeroSince = new Date(Date.now() - ZERO_RESULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const [topTerms, zeroResultTerms] = await Promise.all([
      this.queryLog.findTrending(topSince, 20),
      this.queryLog.findZeroResultTerms(zeroSince, 20),
    ]);

    return { topTerms, zeroResultTerms };
  }
}
