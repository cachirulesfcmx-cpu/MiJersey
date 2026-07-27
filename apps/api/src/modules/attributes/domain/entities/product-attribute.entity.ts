export interface ProductAttributeProps {
  id: string;
  productId: string;
  attributeId: string;
  valueId: string | null;
  customValue: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductAttributeEntity {
  constructor(private readonly props: ProductAttributeProps) {}

  get id(): string {
    return this.props.id;
  }

  get productId(): string {
    return this.props.productId;
  }

  get attributeId(): string {
    return this.props.attributeId;
  }

  get valueId(): string | null {
    return this.props.valueId;
  }

  get customValue(): string | null {
    return this.props.customValue;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): ProductAttributeProps {
    return { ...this.props };
  }
}
