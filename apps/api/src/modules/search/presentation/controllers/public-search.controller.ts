import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';

import { Public } from '../../../../common/decorators/public.decorator';
import { GetSearchSuggestionsUseCase } from '../../application/use-cases/get-search-suggestions.use-case';
import { GetTrendingSearchesUseCase } from '../../application/use-cases/get-trending-searches.use-case';
import { LogSearchClickUseCase } from '../../application/use-cases/log-search-click.use-case';
import { SearchUseCase } from '../../application/use-cases/search.use-case';
import { LogSearchClickDto } from '../dto/log-search-click.dto';
import { SearchQueryDto } from '../dto/search-query.dto';
import { SearchSuggestionsQueryDto } from '../dto/search-suggestions-query.dto';
import { SearchTrendingQueryDto } from '../dto/search-trending-query.dto';
import { SearchExceptionFilter } from '../filters/search-exception.filter';

@Controller('search')
@Public()
@UseFilters(SearchExceptionFilter)
export class PublicSearchController {
  constructor(
    private readonly searchUseCase: SearchUseCase,
    private readonly getSuggestionsUseCase: GetSearchSuggestionsUseCase,
    private readonly getTrendingUseCase: GetTrendingSearchesUseCase,
    private readonly logClickUseCase: LogSearchClickUseCase,
  ) {}

  // Declarado antes de rutas con parámetros dinámicos por el mismo motivo que 005/006/007/014: evitar que Express confunda un segmento fijo con un parámetro.
  @Get('suggestions')
  async suggestions(@Query() query: SearchSuggestionsQueryDto) {
    const items = await this.getSuggestionsUseCase.execute(query.q, query.limit);
    return { items };
  }

  @Get('trending')
  async trending(@Query() query: SearchTrendingQueryDto) {
    const items = await this.getTrendingUseCase.execute(query.limit);
    return { items };
  }

  @Post('click')
  @HttpCode(HttpStatus.NO_CONTENT)
  async click(@Body() dto: LogSearchClickDto) {
    await this.logClickUseCase.execute(dto);
  }

  @Get()
  search(@Query() query: SearchQueryDto) {
    return this.searchUseCase.execute({
      term: query.q,
      page: query.page,
      pageSize: query.pageSize,
      ...(query.sessionId ? { sessionId: query.sessionId } : {}),
    });
  }
}
