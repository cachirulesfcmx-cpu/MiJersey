export interface AttributeValueProps {
  id: string;
  attributeId: string;
  value: string;
  label: string;
  sortOrder: number;
}

export class AttributeValueEntity {
  constructor(private readonly props: AttributeValueProps) {}

  get id(): string {
    return this.props.id;
  }

  get attributeId(): string {
    return this.props.attributeId;
  }

  get value(): string {
    return this.props.value;
  }

  get label(): string {
    return this.props.label;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  toJSON(): AttributeValueProps {
    return { ...this.props };
  }
}
