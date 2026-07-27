import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { MediaAssetInUseError, MediaAssetNotFoundError } from '../../domain/errors/media.errors';
import type { MediaAssetRepositoryPort } from '../../domain/ports/media-asset.repository.port';
import type { MediaAssetUsageRepositoryPort } from '../../domain/ports/media-usage.repository.port';
import type { StoragePort } from '../../domain/ports/storage.port';
import {
  MEDIA_ASSET_REPOSITORY,
  MEDIA_ASSET_USAGE_REPOSITORY,
  STORAGE_PORT,
} from '../../media.constants';

export interface DeleteMediaInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

/** La miniatura se guarda con su propio `storageKey`, pero solo conocemos su URL — el nombre de archivo es la parte final, sin más segmentos. */
function storageKeyFromUrl(url: string): string {
  return url.slice(url.lastIndexOf('/') + 1);
}

@Injectable()
export class DeleteMediaUseCase {
  constructor(
    @Inject(MEDIA_ASSET_REPOSITORY) private readonly assets: MediaAssetRepositoryPort,
    @Inject(MEDIA_ASSET_USAGE_REPOSITORY) private readonly usages: MediaAssetUsageRepositoryPort,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteMediaInput): Promise<void> {
    const asset = await this.assets.findById(input.id);
    if (!asset) {
      throw new MediaAssetNotFoundError();
    }

    if ((await this.usages.countByAsset(input.id)) > 0) {
      throw new MediaAssetInUseError();
    }

    await this.assets.delete(input.id);
    await this.storage.delete(asset.storageKey);
    if (asset.thumbnailUrl) {
      await this.storage.delete(storageKeyFromUrl(asset.thumbnailUrl));
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'media.asset.deleted',
      ipAddress: input.ipAddress,
      metadata: { mediaAssetId: input.id },
    });
  }
}
