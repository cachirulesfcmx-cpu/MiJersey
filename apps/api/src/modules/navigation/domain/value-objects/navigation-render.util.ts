import type { NavigationItemType } from './navigation-enums';
import {
  evaluateVisibility,
  type VisibilityContext,
  type VisibilityRules,
} from './visibility-rules.util';

export interface ResolvedNavigationNode {
  id: string;
  parentId: string | null;
  label: string;
  type: NavigationItemType;
  href: string;
  icon: string | null;
  sortOrder: number;
  openInNewTab: boolean;
  visibilityRules: VisibilityRules | null;
}

export interface RenderedNavigationItem {
  id: string;
  label: string;
  type: NavigationItemType;
  href: string;
  icon: string | null;
  openInNewTab: boolean;
  children: RenderedNavigationItem[];
}

/** Arma el árbol anidado a partir de la lista plana ya resuelta (con `href` calculado y nodos huérfanos por recursos eliminados ya descartados), ordenando cada nivel por `sortOrder` — spec §5 "renderizado de árboles". */
export function buildNavigationTree(nodes: ResolvedNavigationNode[]): RenderedNavigationItem[] {
  const byParent = new Map<string | null, ResolvedNavigationNode[]>();
  for (const node of nodes) {
    const siblings = byParent.get(node.parentId) ?? [];
    siblings.push(node);
    byParent.set(node.parentId, siblings);
  }

  function build(parentId: string | null): RenderedNavigationItem[] {
    const siblings = (byParent.get(parentId) ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return siblings.map((node) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      href: node.href,
      icon: node.icon,
      openInNewTab: node.openInNewTab,
      children: build(node.id),
    }));
  }

  return build(null);
}

/** Filtra el árbol por contexto (spec §2/§4 "visibilidad por contexto") aplicado después de leer la caché, para no fragmentarla por contexto. Un nodo no visible oculta también a sus descendientes. */
export function filterVisibleTree(
  nodes: ResolvedNavigationNode[],
  context: VisibilityContext,
): ResolvedNavigationNode[] {
  const memo = new Map<string, boolean>();
  const byId = new Map(nodes.map((node) => [node.id, node]));

  function isHidden(node: ResolvedNavigationNode): boolean {
    const cached = memo.get(node.id);
    if (cached !== undefined) return cached;

    let hidden = !evaluateVisibility(node.visibilityRules, context);
    if (!hidden && node.parentId) {
      const parent = byId.get(node.parentId);
      if (parent) hidden = isHidden(parent);
    }

    memo.set(node.id, hidden);
    return hidden;
  }

  return nodes.filter((node) => !isHidden(node));
}
