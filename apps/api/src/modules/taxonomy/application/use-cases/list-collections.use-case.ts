import { Inject, Injectable } from '@nestjs/common';

import type {
  CollectionRepositoryPort,
  ListCollectionsParams,
  ListCollectionsResult,
} from '../../domain/ports/collection.repository.port';
import { COLLECTION_REPOSITORY } from '../../taxonomy.constants';

@Injectable()
export class ListCollectionsUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepositoryPort,
  ) {}

  execute(params: ListCollectionsParams): Promise<ListCollectionsResult> {
    return this.collections.findMany(params);
  }
}
