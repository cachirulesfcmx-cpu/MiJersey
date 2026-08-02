import type { NavigationItemType } from '../value-objects/navigation-enums';
import type { VisibilityRules } from '../value-objects/visibility-rules.util';

export interface NavigationItemProps {
  id: string;
  menuId: string;
  parentId: string | null;
  label: string;
  type: NavigationItemType;
  target: string;
  icon: string | null;
  sortOrder: number;
  visibilityRules: VisibilityRules | null;
  openInNewTab: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class NavigationItemEntity {
  constructor(private readonly props: NavigationItemProps) {}

  get id(): string {
    return this.props.id;
  }

  get parentId(): string | null {
    return this.props.parentId;
  }

  get type(): NavigationItemType {
    return this.props.type;
  }

  get target(): string {
    return this.props.target;
  }

  toJSON(): NavigationItemProps {
    return { ...this.props };
  }
}
