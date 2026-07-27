import type { ProductOptionValueEntity } from './product-option-value.entity';

export interface ProductOptionProps {
  id: string;
  productId: string;
  name: string;
  position: number;
  values: ProductOptionValueEntity[];
}

export class ProductOptionEntity {
  constructor(private readonly props: ProductOptionProps) {}

  get id(): string {
    return this.props.id;
  }

  get productId(): string {
    return this.props.productId;
  }

  get name(): string {
    return this.props.name;
  }

  get position(): number {
    return this.props.position;
  }

  get values(): ProductOptionValueEntity[] {
    return this.props.values;
  }

  toJSON(): {
    id: string;
    productId: string;
    name: string;
    position: number;
    values: ReturnType<ProductOptionValueEntity['toJSON']>[];
  } {
    return { ...this.props, values: this.props.values.map((value) => value.toJSON()) };
  }
}
