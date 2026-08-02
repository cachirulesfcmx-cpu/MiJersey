import type { NavigationMenuStatus } from '../value-objects/navigation-enums';
import type { NavigationItemEntity, NavigationItemProps } from './navigation-item.entity';

export interface NavigationMenuProps {
  id: string;
  name: string;
  location: string;
  status: NavigationMenuStatus;
  items: NavigationItemEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export class NavigationMenuEntity {
  constructor(private readonly props: NavigationMenuProps) {}

  get id(): string {
    return this.props.id;
  }

  get location(): string {
    return this.props.location;
  }

  get status(): NavigationMenuStatus {
    return this.props.status;
  }

  get items(): NavigationItemEntity[] {
    return this.props.items;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): Omit<NavigationMenuProps, 'items'> & { items: NavigationItemProps[] } {
    return {
      ...this.props,
      items: this.props.items.map((item) => item.toJSON()),
    };
  }
}
