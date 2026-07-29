import { Inject, Injectable } from '@nestjs/common';

import { SearchSynonymEntity } from '../../domain/entities/search-synonym.entity';
import type { SearchSynonymRepositoryPort } from '../../domain/ports/search-synonym.repository.port';
import { SEARCH_SYNONYM_REPOSITORY } from '../../search.constants';

@Injectable()
export class ListSearchSynonymsUseCase {
  constructor(
    @Inject(SEARCH_SYNONYM_REPOSITORY) private readonly synonyms: SearchSynonymRepositoryPort,
  ) {}

  execute(): Promise<SearchSynonymEntity[]> {
    return this.synonyms.findMany();
  }
}
