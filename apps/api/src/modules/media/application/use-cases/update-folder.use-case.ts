import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { FolderEntity } from '../../domain/entities/folder.entity';
import {
  FolderNotFoundError,
  FolderSlugAlreadyExistsError,
} from '../../domain/errors/media.errors';
import type { FolderRepositoryPort } from '../../domain/ports/folder.repository.port';
import { Slug } from '../../domain/value-objects/slug.vo';
import { FOLDER_REPOSITORY } from '../../media.constants';

export interface UpdateFolderInput {
  id: string;
  name?: string;
  slug?: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateFolderUseCase {
  constructor(
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateFolderInput): Promise<FolderEntity> {
    const existing = await this.folders.findById(input.id);
    if (!existing) {
      throw new FolderNotFoundError();
    }

    let slug: string | undefined;
    if (input.slug?.trim()) {
      slug = Slug.create(input.slug).toString();
      if (slug !== existing.slug && (await this.folders.existsBySlug(slug))) {
        throw new FolderSlugAlreadyExistsError();
      }
    }

    const folder = await this.folders.update(input.id, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(slug !== undefined ? { slug } : {}),
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'media.folder.updated',
      ipAddress: input.ipAddress,
      metadata: { folderId: folder.id },
    });

    return folder;
  }
}
