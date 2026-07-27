export interface ProductOptionValueProps {
  id: string;
  optionId: string;
  value: string;
  position: number;
}

export class ProductOptionValueEntity {
  constructor(private readonly props: ProductOptionValueProps) {}

  get id(): string {
    return this.props.id;
  }

  get optionId(): string {
    return this.props.optionId;
  }

  get value(): string {
    return this.props.value;
  }

  get position(): number {
    return this.props.position;
  }

  toJSON(): ProductOptionValueProps {
    return { ...this.props };
  }
}
