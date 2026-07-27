import { Inject, Injectable } from '@nestjs/common';

import type { AssetTagEntity } from '../../domain/entities/asset-tag.entity';
import type { AssetTagRepositoryPort } from '../../domain/ports/asset-tag.repository.port';
import { ASSET_TAG_REPOSITORY } from '../../media.constants';

@Injectable()
export class ListTagsUseCase {
  constructor(@Inject(ASSET_TAG_REPOSITORY) private readonly tags: AssetTagRepositoryPort) {}

  execute(): Promise<AssetTagEntity[]> {
    return this.tags.findAll();
  }
}
