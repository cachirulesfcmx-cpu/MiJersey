import { Inject, Injectable } from '@nestjs/common';

import type { CollectionProps } from '../../domain/entities/collection.entity';
import type { CollectionRepositoryPort } from '../../domain/ports/collection.repository.port';
import { COLLECTION_REPOSITORY, DEFAULT_PAGE_SIZE } from '../../taxonomy.constants';
import { TaxonomyCacheService } from '../services/taxonomy-cache.service';

export interface ListPublicCollectionsInput {
  search?: string;
  page: number;
  pageSize: number;
}

export interface PlainCollectionsList {
  items: CollectionProps[];
  total: number;
}

/** Solo la consulta por defecto (sin búsqueda, página 1) pasa por la caché de Redis. */
@Injectable()
export class ListPublicCollectionsUseCase {
  constructor(
    @Inject(COLLECTION_REPOSITORY) private readonly collections: CollectionRepositoryPort,
    private readonly cache: TaxonomyCacheService,
  ) {}

  async execute(input: ListPublicCollectionsInput): Promise<PlainCollectionsList> {
    const isDefaultQuery =
      !input.search && input.page === 1 && input.pageSize === DEFAULT_PAGE_SIZE;

    if (isDefaultQuery) {
      const cached = await this.cache.getDefaultCollectionsList();
      if (cached) {
        return JSON.parse(cached) as PlainCollectionsList;
      }
    }

    const result = await this.collections.findManyPublic({
      ...(input.search ? { search: input.search } : {}),
      page: input.page,
      pageSize: input.pageSize,
    });
    const plain: PlainCollectionsList = {
      items: result.items.map((collection) => collection.toJSON()),
      total: result.total,
    };

    if (isDefaultQuery) {
      await this.cache.setDefaultCollectionsList(JSON.stringify(plain));
    }

    return plain;
  }
}
