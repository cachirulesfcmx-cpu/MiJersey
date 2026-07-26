import type { CategoryEntity, CategoryProps } from '../../domain/entities/category.entity';
import type { CategoryRepositoryPort } from '../../domain/ports/category.repository.port';

export interface CategoryTreeNode {
  category: CategoryEntity;
  children: CategoryTreeNode[];
}

export type PlainCategoryTreeNode = CategoryProps & { children: PlainCategoryTreeNode[] };

export function toPlainTree(nodes: CategoryTreeNode[]): PlainCategoryTreeNode[] {
  return nodes.map((node) => ({ ...node.category.toJSON(), children: toPlainTree(node.children) }));
}

/** Arma el árbol a partir de una lista plana, ordenando hermanas por `sortOrder`. */
export function buildTree(flat: CategoryEntity[]): CategoryTreeNode[] {
  const byParent = new Map<string | null, CategoryEntity[]>();

  for (const category of flat) {
    const siblings = byParent.get(category.parentId) ?? [];
    siblings.push(category);
    byParent.set(category.parentId, siblings);
  }

  function build(parentId: string | null): CategoryTreeNode[] {
    const siblings = (byParent.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return siblings.map((category) => ({ category, children: build(category.id) }));
  }

  return build(null);
}

/** Profundidad de `categoryId` en el árbol (raíz = 0). `null` se trata como la raíz virtual (-1 + 1 = 0). */
export async function computeDepth(
  categories: CategoryRepositoryPort,
  categoryId: string | null,
): Promise<number> {
  let depth = 0;
  let currentId = categoryId;

  while (currentId !== null) {
    const current = await categories.findById(currentId);
    if (!current) break;
    depth += 1;
    currentId = current.parentId;
  }

  return depth;
}

/** `true` si mover/crear `categoryId` bajo `proposedParentId` formaría un ciclo. */
export async function wouldCreateCycle(
  categories: CategoryRepositoryPort,
  categoryId: string,
  proposedParentId: string | null,
): Promise<boolean> {
  let currentId = proposedParentId;

  while (currentId !== null) {
    if (currentId === categoryId) return true;
    const current = await categories.findById(currentId);
    if (!current) break;
    currentId = current.parentId;
  }

  return false;
}
