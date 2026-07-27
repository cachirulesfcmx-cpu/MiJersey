import { Inject, Injectable } from '@nestjs/common';

import type {
  ListMediaAssetsFilter,
  ListMediaAssetsResult,
  MediaAssetRepositoryPort,
} from '../../domain/ports/media-asset.repository.port';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MEDIA_ASSET_REPOSITORY } from '../../media.constants';

export interface ListMediaInput {
  filter?: ListMediaAssetsFilter;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class ListMediaUseCase {
  constructor(@Inject(MEDIA_ASSET_REPOSITORY) private readonly assets: MediaAssetRepositoryPort) {}

  execute(input: ListMediaInput): Promise<ListMediaAssetsResult> {
    const page = input.page && input.page > 0 ? input.page : 1;
    const pageSize = Math.min(
      input.pageSize && input.pageSize > 0 ? input.pageSize : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );

    return this.assets.findMany({
      ...(input.filter ? { filter: input.filter } : {}),
      page,
      pageSize,
    });
  }
}
