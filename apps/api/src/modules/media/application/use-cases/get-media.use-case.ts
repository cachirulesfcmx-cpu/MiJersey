import { Inject, Injectable } from '@nestjs/common';

import type { MediaAssetEntity } from '../../domain/entities/media-asset.entity';
import { MediaAssetNotFoundError } from '../../domain/errors/media.errors';
import type { MediaAssetRepositoryPort } from '../../domain/ports/media-asset.repository.port';
import { MEDIA_ASSET_REPOSITORY } from '../../media.constants';

@Injectable()
export class GetMediaUseCase {
  constructor(@Inject(MEDIA_ASSET_REPOSITORY) private readonly assets: MediaAssetRepositoryPort) {}

  async execute(id: string): Promise<MediaAssetEntity> {
    const asset = await this.assets.findById(id);
    if (!asset) {
      throw new MediaAssetNotFoundError();
    }
    return asset;
  }
}
