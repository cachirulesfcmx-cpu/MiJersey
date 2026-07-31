export interface WishlistItemProps {
  id: string;
  wishlistId: string;
  productId: string;
  variantId: string;
  createdAt: Date;
}

export class WishlistItemEntity {
  constructor(private readonly props: WishlistItemProps) {}

  get id(): string {
    return this.props.id;
  }

  get wishlistId(): string {
    return this.props.wishlistId;
  }

  get variantId(): string {
    return this.props.variantId;
  }

  get productId(): string {
    return this.props.productId;
  }

  toJSON(): WishlistItemProps {
    return { ...this.props };
  }
}
