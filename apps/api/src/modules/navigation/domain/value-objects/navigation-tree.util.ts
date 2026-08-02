import {
  InvalidNavigationItemError,
  NavigationDepthExceededError,
} from '../errors/navigation.errors';

export interface TreeNode {
  id: string;
  parentId: string | null;
}

/** Valida que el árbol (identificado por `id`/`parentId`, sea con ids reales o `tempId`s) no supere la profundidad máxima y no tenga referencias de padre inexistentes ni ciclos — spec §4 "profundidad configurable de niveles". */
export function assertValidTreeDepth(nodes: TreeNode[], maxDepth: number): void {
  const byId = new Map(nodes.map((node) => [node.id, node]));

  for (const node of nodes) {
    let depth = 0;
    let current: TreeNode | undefined = node;
    const seen = new Set<string>();

    while (current?.parentId) {
      if (seen.has(current.id)) {
        throw new InvalidNavigationItemError(
          'El árbol de navegación no puede tener referencias cíclicas',
        );
      }
      seen.add(current.id);

      const parent = byId.get(current.parentId);
      if (!parent) {
        throw new InvalidNavigationItemError(
          `El ítem "${current.id}" referencia un padre que no existe en la solicitud`,
        );
      }

      depth += 1;
      if (depth >= maxDepth) {
        throw new NavigationDepthExceededError(maxDepth);
      }

      current = parent;
    }
  }
}

/** Ordena los nodos de manera que cada padre aparezca antes que sus hijos (orden topológico simple para un árbol) — necesario para crear filas respetando la FK `parentId`. */
export function toParentFirstOrder<T extends TreeNode>(nodes: T[]): T[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const ordered: T[] = [];
  const visited = new Set<string>();

  function visit(node: T): void {
    if (visited.has(node.id)) return;
    if (node.parentId) {
      const parent = byId.get(node.parentId);
      if (parent) visit(parent);
    }
    visited.add(node.id);
    ordered.push(node);
  }

  for (const node of nodes) visit(node);
  return ordered;
}
