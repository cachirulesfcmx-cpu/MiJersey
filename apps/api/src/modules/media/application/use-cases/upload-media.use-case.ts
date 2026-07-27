import { createHash } from 'node:crypto';
import { extname } from 'node:path';

import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { MediaAssetEntity } from '../../domain/entities/media-asset.entity';
import { FolderNotFoundError, UnsupportedMediaTypeError } from '../../domain/errors/media.errors';
import type { AssetTagRepositoryPort } from '../../domain/ports/asset-tag.repository.port';
import type { FolderRepositoryPort } from '../../domain/ports/folder.repository.port';
import type { MediaAssetRepositoryPort } from '../../domain/ports/media-asset.repository.port';
import type { StoragePort } from '../../domain/ports/storage.port';
import {
  extensionForMimeType,
  mediaTypeFromMimeType,
} from '../../domain/value-objects/media-enums';
import {
  ASSET_TAG_REPOSITORY,
  FOLDER_REPOSITORY,
  MEDIA_ASSET_REPOSITORY,
  STORAGE_PORT,
} from '../../media.constants';
import { MediaProcessingService } from '../services/media-processing.service';

export interface UploadMediaInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folderId?: string | null;
  title?: string;
  altText?: string;
  tags?: string[];
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UploadMediaUseCase {
  constructor(
    @Inject(MEDIA_ASSET_REPOSITORY) private readonly assets: MediaAssetRepositoryPort,
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepositoryPort,
    @Inject(ASSET_TAG_REPOSITORY) private readonly tags: AssetTagRepositoryPort,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
    private readonly processing: MediaProcessingService,
  ) {}

  async execute(input: UploadMediaInput): Promise<MediaAssetEntity> {
    const type = mediaTypeFromMimeType(input.mimeType);
    if (!type) {
      throw new UnsupportedMediaTypeError(input.mimeType);
    }

    const folderId = input.folderId ?? null;
    if (folderId !== null && !(await this.folders.findById(folderId))) {
      throw new FolderNotFoundError();
    }

    const contentHash = createHash('sha256').update(input.buffer).digest('hex');
    const existing = await this.assets.findByContentHash(contentHash);
    if (existing) {
      return existing;
    }

    // Procesar antes de guardar: si el archivo está dañado, no debe quedar huérfano en el almacenamiento.
    const processed = await this.processing.process(input.buffer, type);
    const extension = extname(input.originalName) || extensionForMimeType(input.mimeType);
    const stored = await this.storage.save(input.buffer, extension);

    const asset = await this.assets.create({
      filename: stored.storageKey,
      originalName: input.originalName,
      mimeType: input.mimeType,
      type,
      size: input.buffer.length,
      width: processed.width,
      height: processed.height,
      duration: processed.duration,
      contentHash,
      storageKey: stored.storageKey,
      url: stored.url,
      thumbnailUrl: processed.thumbnailUrl,
      folderId,
      title: input.title?.trim() || null,
      altText: input.altText?.trim() || null,
    });

    if (input.tags?.length) {
      const tagEntities = await this.tags.findOrCreateByNames(input.tags);
      await this.assets.replaceTags(
        asset.id,
        tagEntities.map((tag) => tag.id),
      );
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'media.asset.uploaded',
      ipAddress: input.ipAddress,
      metadata: { mediaAssetId: asset.id, mimeType: input.mimeType, size: asset.size },
    });

    return (await this.assets.findById(asset.id)) ?? asset;
  }
}
