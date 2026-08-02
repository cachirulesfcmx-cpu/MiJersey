import type { NavigationItemType } from '../value-objects/navigation-enums';
import type { NavigationMenuStatus } from '../value-objects/navigation-enums';
import type { VisibilityRules } from '../value-objects/visibility-rules.util';

export interface NavigationSnapshotItem {
  tempId: string;
  parentTempId: string | null;
  label: string;
  type: NavigationItemType;
  target: string;
  icon: string | null;
  sortOrder: number;
  visibilityRules: VisibilityRules | null;
  openInNewTab: boolean;
}

/** Snapshot completo (mismo criterio que `PageSnapshot`/`PostSnapshot`): incluye el árbol entero de ítems, identificados por `tempId` (no por id real de fila) para poder recrearlos tal cual al restaurar. `status` se conserva solo con fines informativos, igual que en CMS Pages/Blog. */
export interface NavigationSnapshot {
  name: string;
  location: string;
  status: NavigationMenuStatus;
  items: NavigationSnapshotItem[];
}

export interface NavigationVersionProps {
  id: string;
  menuId: string;
  versionNumber: number;
  snapshot: NavigationSnapshot;
  createdAt: Date;
}

export class NavigationVersionEntity {
  constructor(private readonly props: NavigationVersionProps) {}

  get versionNumber(): number {
    return this.props.versionNumber;
  }

  get snapshot(): NavigationSnapshot {
    return this.props.snapshot;
  }

  toJSON(): NavigationVersionProps {
    return { ...this.props };
  }
}
