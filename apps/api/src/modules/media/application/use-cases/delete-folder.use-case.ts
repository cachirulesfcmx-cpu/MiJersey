import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { FolderNotEmptyError, FolderNotFoundError } from '../../domain/errors/media.errors';
import type { FolderRepositoryPort } from '../../domain/ports/folder.repository.port';
import { FOLDER_REPOSITORY } from '../../media.constants';

export interface DeleteFolderInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteFolderUseCase {
  constructor(
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteFolderInput): Promise<void> {
    const folder = await this.folders.findById(input.id);
    if (!folder) {
      throw new FolderNotFoundError();
    }

    if (await this.folders.hasChildren(input.id)) {
      throw new FolderNotEmptyError();
    }

    if ((await this.folders.countAssets(input.id)) > 0) {
      throw new FolderNotEmptyError();
    }

    await this.folders.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'media.folder.deleted',
      ipAddress: input.ipAddress,
      metadata: { folderId: input.id },
    });
  }
}
