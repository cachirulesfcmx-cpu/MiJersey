import type { WishlistItemEntity } from './wishlist-item.entity';

export interface WishlistProps {
  id: string;
  customerId: string;
  name: string;
  isDefault: boolean;
  shareToken: string | null;
  items: WishlistItemEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export class WishlistEntity {
  constructor(private readonly props: WishlistProps) {}

  get id(): string {
    return this.props.id;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get name(): string {
    return this.props.name;
  }

  get shareToken(): string | null {
    return this.props.shareToken;
  }

  get items(): WishlistItemEntity[] {
    return this.props.items;
  }

  toJSON(): Omit<WishlistProps, 'items'> & { items: ReturnType<WishlistItemEntity['toJSON']>[] } {
    return { ...this.props, items: this.props.items.map((item) => item.toJSON()) };
  }
}
