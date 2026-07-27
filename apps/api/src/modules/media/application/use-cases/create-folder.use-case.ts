import { slugify } from '@mijersey/shared-utils';
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

export interface CreateFolderInput {
  name: string;
  slug?: string;
  parentId?: string | null;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateFolderUseCase {
  constructor(
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateFolderInput): Promise<FolderEntity> {
    const slug = Slug.create(input.slug?.trim() ? input.slug : slugify(input.name)).toString();

    if (await this.folders.existsBySlug(slug)) {
      throw new FolderSlugAlreadyExistsError();
    }

    const parentId = input.parentId ?? null;
    if (parentId !== null && !(await this.folders.findById(parentId))) {
      throw new FolderNotFoundError();
    }

    const folder = await this.folders.create({ name: input.name.trim(), slug, parentId });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'media.folder.created',
      ipAddress: input.ipAddress,
      metadata: { folderId: folder.id },
    });

    return folder;
  }
}
