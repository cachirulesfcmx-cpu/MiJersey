import type { CategoryTreeNode } from '@mijersey/sdk';

export interface FlatCategoryOption {
  id: string;
  name: string;
  depth: number;
}

export function flattenTree(nodes: CategoryTreeNode[], depth = 0): FlatCategoryOption[] {
  return nodes.flatMap((node) => [
    { id: node.id, name: node.name, depth },
    ...flattenTree(node.children, depth + 1),
  ]);
}

/** IDs de `nodeId` y todos sus descendientes (para excluirlos como padre válido al editar). */
export function collectSubtreeIds(nodes: CategoryTreeNode[], nodeId: string): Set<string> {
  function findNode(list: CategoryTreeNode[]): CategoryTreeNode | null {
    for (const node of list) {
      if (node.id === nodeId) return node;
      const found = findNode(node.children);
      if (found) return found;
    }
    return null;
  }

  function collectIds(node: CategoryTreeNode): string[] {
    return [node.id, ...node.children.flatMap(collectIds)];
  }

  const target = findNode(nodes);
  return new Set(target ? collectIds(target) : [nodeId]);
}
