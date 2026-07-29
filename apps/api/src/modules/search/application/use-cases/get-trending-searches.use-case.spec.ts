import type { SearchQueryLogRepositoryPort } from '../../domain/ports/search-query-log.repository.port';
import type { SearchCacheService } from '../services/search-cache.service';
import { GetTrendingSearchesUseCase } from './get-trending-searches.use-case';

function buildUseCase(cached: { term: string; count: number }[] | null) {
  const queryLog: jest.Mocked<SearchQueryLogRepositoryPort> = {
    record: jest.fn(),
    findTrending: jest.fn().mockResolvedValue([{ term: 'jersey', count: 5 }]),
    findZeroResultTerms: jest.fn(),
  };
  const cache = {
    getTrending: jest.fn().mockResolvedValue(cached),
    setTrending: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SearchCacheService>;

  return { useCase: new GetTrendingSearchesUseCase(queryLog, cache), queryLog, cache };
}

describe('GetTrendingSearchesUseCase', () => {
  it('returns cached trending terms without hitting the repository', async () => {
    const { useCase, queryLog } = buildUseCase([{ term: 'balon', count: 9 }]);

    const result = await useCase.execute();

    expect(result).toEqual([{ term: 'balon', count: 9 }]);
    expect(queryLog.findTrending).not.toHaveBeenCalled();
  });

  it('computes and caches trending terms on a cache miss', async () => {
    const { useCase, queryLog, cache } = buildUseCase(null);

    const result = await useCase.execute();

    expect(queryLog.findTrending).toHaveBeenCalled();
    expect(cache.setTrending).toHaveBeenCalledWith([{ term: 'jersey', count: 5 }]);
    expect(result).toEqual([{ term: 'jersey', count: 5 }]);
  });

  it('truncates the cached result to the requested limit', async () => {
    const { useCase } = buildUseCase([
      { term: 'a', count: 3 },
      { term: 'b', count: 2 },
      { term: 'c', count: 1 },
    ]);

    const result = await useCase.execute(2);

    expect(result).toHaveLength(2);
  });
});
