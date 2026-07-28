import { Inject, Injectable } from '@nestjs/common';

import { MediaAssetNotFoundError } from '../../domain/errors/media.errors';
import type { MediaAssetRepositoryPort } from '../../domain/ports/media-asset.repository.port';
import type {
  MediaAssetUsageRecord,
  MediaAssetUsageRepositoryPort,
} from '../../domain/ports/media-usage.repository.port';
import { MEDIA_ASSET_REPOSITORY, MEDIA_ASSET_USAGE_REPOSITORY } from '../../media.constants';

/**
 * Punto de integración para otros módulos (p. ej. Brands en 011): registran o
 * quitan el uso de un `MediaAsset` sin que Media Library conozca su dominio,
 * vía (referenceType, referenceId). Se exporta desde `MediaModule` para que
 * otros módulos la inyecten directamente, igual que `AttributesModule` exporta
 * `SearchProductsUseCase` para `CatalogModule`.
 */
@Injectable()
export class MediaUsageService {
  constructor(
    @Inject(MEDIA_ASSET_REPOSITORY) private readonly assets: MediaAssetRepositoryPort,
    @Inject(MEDIA_ASSET_USAGE_REPOSITORY) private readonly usages: MediaAssetUsageRepositoryPort,
  ) {}

  async recordUsage(
    mediaAssetId: string,
    referenceType: string,
    referenceId: string,
  ): Promise<void> {
    if (!(await this.assets.findById(mediaAssetId))) {
      throw new MediaAssetNotFoundError();
    }
    await this.usages.record(mediaAssetId, referenceType, referenceId);
  }

  async removeUsage(
    mediaAssetId: string,
    referenceType: string,
    referenceId: string,
  ): Promise<void> {
    await this.usages.remove(mediaAssetId, referenceType, referenceId);
  }

  countByAsset(mediaAssetId: string): Promise<number> {
    return this.usages.countByAsset(mediaAssetId);
  }

  findByAsset(mediaAssetId: string): Promise<MediaAssetUsageRecord[]> {
    return this.usages.findByAsset(mediaAssetId);
  }

  /** Resuelve las URLs servibles de un asset — para que un consumidor público (p. ej. la página de marca) no tenga que llamar a los endpoints administrativos de Media. */
  async resolveUrls(
    mediaAssetId: string,
  ): Promise<{ url: string; thumbnailUrl: string | null } | null> {
    const asset = await this.assets.findById(mediaAssetId);
    return asset ? { url: asset.url, thumbnailUrl: asset.thumbnailUrl } : null;
  }
}
