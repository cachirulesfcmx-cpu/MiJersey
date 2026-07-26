import type { ProductStatus, ProductType, ProductVisibility } from '../value-objects/product-enums';

export interface ProductProps {
  id: string;
  sku: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  status: ProductStatus;
  visibility: ProductVisibility;
  type: ProductType;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductEntity {
  constructor(private readonly props: ProductProps) {}

  get id(): string {
    return this.props.id;
  }

  get sku(): string {
    return this.props.sku;
  }

  get slug(): string {
    return this.props.slug;
  }

  get name(): string {
    return this.props.name;
  }

  get shortDescription(): string | null {
    return this.props.shortDescription;
  }

  get description(): string | null {
    return this.props.description;
  }

  get status(): ProductStatus {
    return this.props.status;
  }

  get visibility(): ProductVisibility {
    return this.props.visibility;
  }

  get type(): ProductType {
    return this.props.type;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): ProductProps {
    return { ...this.props };
  }
}
