import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { FolderEntity } from '../../domain/entities/folder.entity';
import { FolderCycleError, FolderNotFoundError } from '../../domain/errors/media.errors';
import type { FolderRepositoryPort } from '../../domain/ports/folder.repository.port';
import { FOLDER_REPOSITORY } from '../../media.constants';
import { wouldCreateCycle } from './folder-tree.util';

export interface MoveFolderInput {
  id: string;
  parentId: string | null;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class MoveFolderUseCase {
  constructor(
    @Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: MoveFolderInput): Promise<FolderEntity> {
    const folder = await this.folders.findById(input.id);
    if (!folder) {
      throw new FolderNotFoundError();
    }

    if (input.parentId !== null) {
      if (input.parentId === input.id) {
        throw new FolderCycleError();
      }

      const parent = await this.folders.findById(input.parentId);
      if (!parent) {
        throw new FolderNotFoundError();
      }

      if (await wouldCreateCycle(this.folders, input.id, input.parentId)) {
        throw new FolderCycleError();
      }
    }

    const moved = await this.folders.move(input.id, input.parentId);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'media.folder.moved',
      ipAddress: input.ipAddress,
      metadata: { folderId: moved.id, parentId: input.parentId },
    });

    return moved;
  }
}
