import { Inject, Injectable } from '@nestjs/common';

import type { FolderRepositoryPort } from '../../domain/ports/folder.repository.port';
import { FOLDER_REPOSITORY } from '../../media.constants';
import { buildTree, type PlainFolderTreeNode, toPlainTree } from './folder-tree.util';

@Injectable()
export class ListFoldersUseCase {
  constructor(@Inject(FOLDER_REPOSITORY) private readonly folders: FolderRepositoryPort) {}

  async execute(): Promise<PlainFolderTreeNode[]> {
    const flat = await this.folders.findAll();
    return toPlainTree(buildTree(flat));
  }
}
