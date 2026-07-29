import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { SearchCacheService } from './application/services/search-cache.service';
import { CreateSearchSynonymUseCase } from './application/use-cases/create-search-synonym.use-case';
import { DeleteSearchSynonymUseCase } from './application/use-cases/delete-search-synonym.use-case';
import { GetSearchAnalyticsUseCase } from './application/use-cases/get-search-analytics.use-case';
import { GetSearchSuggestionsUseCase } from './application/use-cases/get-search-suggestions.use-case';
import { GetTrendingSearchesUseCase } from './application/use-cases/get-trending-searches.use-case';
import { ListSearchSynonymsUseCase } from './application/use-cases/list-search-synonyms.use-case';
import { LogSearchClickUseCase } from './application/use-cases/log-search-click.use-case';
import { SearchUseCase } from './application/use-cases/search.use-case';
import { UpdateSearchSynonymUseCase } from './application/use-cases/update-search-synonym.use-case';
import { PrismaSearchClickLogRepository } from './infrastructure/persistence/prisma-search-click-log.repository';
import { PrismaSearchLookupRepository } from './infrastructure/persistence/prisma-search-lookup.repository';
import { PrismaSearchQueryLogRepository } from './infrastructure/persistence/prisma-search-query-log.repository';
import { PrismaSearchSynonymRepository } from './infrastructure/persistence/prisma-search-synonym.repository';
import { AdminSearchController } from './presentation/controllers/admin-search.controller';
import { PublicSearchController } from './presentation/controllers/public-search.controller';
import {
  SEARCH_CLICK_LOG_REPOSITORY,
  SEARCH_LOOKUP,
  SEARCH_QUERY_LOG_REPOSITORY,
  SEARCH_SYNONYM_REPOSITORY,
} from './search.constants';

@Module({
  imports: [IdentityModule],
  controllers: [PublicSearchController, AdminSearchController],
  providers: [
    SearchUseCase,
    GetSearchSuggestionsUseCase,
    GetTrendingSearchesUseCase,
    LogSearchClickUseCase,
    ListSearchSynonymsUseCase,
    CreateSearchSynonymUseCase,
    UpdateSearchSynonymUseCase,
    DeleteSearchSynonymUseCase,
    GetSearchAnalyticsUseCase,
    SearchCacheService,
    { provide: SEARCH_LOOKUP, useClass: PrismaSearchLookupRepository },
    { provide: SEARCH_QUERY_LOG_REPOSITORY, useClass: PrismaSearchQueryLogRepository },
    { provide: SEARCH_CLICK_LOG_REPOSITORY, useClass: PrismaSearchClickLogRepository },
    { provide: SEARCH_SYNONYM_REPOSITORY, useClass: PrismaSearchSynonymRepository },
  ],
})
export class SearchModule {}
