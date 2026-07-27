import type { ProductVariantStatus } from '../value-objects/product-enums';

export interface ProductVariantProps {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  weight: number | null;
  imageId: string | null;
  status: ProductVariantStatus;
  optionValueIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class ProductVariantEntity {
  constructor(private readonly props: ProductVariantProps) {}

  get id(): string {
    return this.props.id;
  }

  get productId(): string {
    return this.props.productId;
  }

  get sku(): string {
    return this.props.sku;
  }

  get barcode(): string | null {
    return this.props.barcode;
  }

  get slug(): string {
    return this.props.slug;
  }

  get title(): string {
    return this.props.title;
  }

  get price(): number {
    return this.props.price;
  }

  get compareAtPrice(): number | null {
    return this.props.compareAtPrice;
  }

  get weight(): number | null {
    return this.props.weight;
  }

  get imageId(): string | null {
    return this.props.imageId;
  }

  get status(): ProductVariantStatus {
    return this.props.status;
  }

  get optionValueIds(): string[] {
    return this.props.optionValueIds;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): ProductVariantProps {
    return { ...this.props };
  }
}
