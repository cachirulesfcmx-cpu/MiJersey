import type { AttributeStatus, AttributeType } from '../value-objects/attribute-enums';
import type { AttributeValueEntity } from './attribute-value.entity';

export interface AttributeProps {
  id: string;
  code: string;
  name: string;
  type: AttributeType;
  isFilterable: boolean;
  isComparable: boolean;
  isRequired: boolean;
  sortOrder: number;
  status: AttributeStatus;
  values: AttributeValueEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export class AttributeEntity {
  constructor(private readonly props: AttributeProps) {}

  get id(): string {
    return this.props.id;
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get type(): AttributeType {
    return this.props.type;
  }

  get isFilterable(): boolean {
    return this.props.isFilterable;
  }

  get isComparable(): boolean {
    return this.props.isComparable;
  }

  get isRequired(): boolean {
    return this.props.isRequired;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get status(): AttributeStatus {
    return this.props.status;
  }

  get values(): AttributeValueEntity[] {
    return this.props.values;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): Omit<AttributeProps, 'values'> & {
    values: ReturnType<AttributeValueEntity['toJSON']>[];
  } {
    return { ...this.props, values: this.props.values.map((value) => value.toJSON()) };
  }
}
