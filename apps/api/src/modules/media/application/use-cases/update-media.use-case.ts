import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { MediaAssetEntity } from '../../domain/entities/media-asset.entity';
import { FolderNotFoundError, MediaAssetNotFoundError } from '../../domain/errors/media.errors';
import type { AssetTagRepositoryPort } from '../../domain/ports/asset-tag.repository.port';
import type { FolderRepositoryPort } from '../../domain/ports/folder.repository.port';
import type { MediaAssetRepositoryPort } from '../../domain/ports/media-asset.repository.port';
import type { MediaAssetStatus } from '../../domain/value-objects/media-enums';
import {
  ASSET_TAG_REPOSITORY,
  FOLDER_REPOSITORY,
  MEDIA_ASSET_REPOSITORY,
} from '../../media.constants';

export interface UpdateMediaInput {
  id: string;
  title?: string | null;
  altText?: string | null;
  folderId?: string | null;
  status?: MediaAssetStatus;
  tags?: string[];
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateMediaUseCase {
  constructor(
    @Inject(MEDIA_ASSET_REPOSITORY) private readonly assets: MediaAssetRepositoryPort,
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepositoryPort,
    @Inject(ASSET_TAG_REPOSITORY) private readonly tags: AssetTagRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateMediaInput): Promise<MediaAssetEntity> {
    const existing = await this.assets.findById(input.id);
    if (!existing) {
      throw new MediaAssetNotFoundError();
    }

    if (
      input.folderId !== undefined &&
      input.folderId !== null &&
      !(await this.folders.findById(input.folderId))
    ) {
      throw new FolderNotFoundError();
    }

    await this.assets.update(input.id, {
      ...(input.title !== undefined ? { title: input.title?.trim() || null } : {}),
      ...(input.altText !== undefined ? { altText: input.altText?.trim() || null } : {}),
      ...(input.folderId !== undefined ? { folderId: input.folderId } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
    });

    if (input.tags) {
      const tagEntities = await this.tags.findOrCreateByNames(input.tags);
      await this.assets.replaceTags(
        input.id,
        tagEntities.map((tag) => tag.id),
      );
    }

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'media.asset.updated',
      ipAddress: input.ipAddress,
      metadata: { mediaAssetId: input.id },
    });

    return (await this.assets.findById(input.id)) as MediaAssetEntity;
  }
}
