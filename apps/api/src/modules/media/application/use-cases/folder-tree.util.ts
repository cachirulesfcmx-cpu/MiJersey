import type { FolderEntity, FolderProps } from '../../domain/entities/folder.entity';
import type { FolderRepositoryPort } from '../../domain/ports/folder.repository.port';

export interface FolderTreeNode {
  folder: FolderEntity;
  children: FolderTreeNode[];
}

export type PlainFolderTreeNode = FolderProps & { children: PlainFolderTreeNode[] };

export function toPlainTree(nodes: FolderTreeNode[]): PlainFolderTreeNode[] {
  return nodes.map((node) => ({ ...node.folder.toJSON(), children: toPlainTree(node.children) }));
}

/** Arma el árbol a partir de una lista plana, ordenando hermanas por nombre. */
export function buildTree(flat: FolderEntity[]): FolderTreeNode[] {
  const byParent = new Map<string | null, FolderEntity[]>();

  for (const folder of flat) {
    const siblings = byParent.get(folder.parentId) ?? [];
    siblings.push(folder);
    byParent.set(folder.parentId, siblings);
  }

  function build(parentId: string | null): FolderTreeNode[] {
    const siblings = (byParent.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
    return siblings.map((folder) => ({ folder, children: build(folder.id) }));
  }

  return build(null);
}

/** `true` si mover/crear `folderId` bajo `proposedParentId` formaría un ciclo. */
export async function wouldCreateCycle(
  folders: FolderRepositoryPort,
  folderId: string,
  proposedParentId: string | null,
): Promise<boolean> {
  let currentId = proposedParentId;

  while (currentId !== null) {
    if (currentId === folderId) return true;
    const current = await folders.findById(currentId);
    if (!current) break;
    currentId = current.parentId;
  }

  return false;
}
