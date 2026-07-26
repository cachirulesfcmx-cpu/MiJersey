import type {
  CollectionRuleField,
  CollectionRuleMatchType,
  CollectionRuleOperator,
  CollectionStatus,
  CollectionType,
} from '../value-objects/taxonomy-enums';

export interface CollectionRule {
  id: string;
  field: CollectionRuleField;
  operator: CollectionRuleOperator;
  value: string;
}

export interface CollectionProps {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: CollectionType;
  status: CollectionStatus;
  matchType: CollectionRuleMatchType;
  rules: CollectionRule[];
  createdAt: Date;
  updatedAt: Date;
}

export class CollectionEntity {
  constructor(private readonly props: CollectionProps) {}

  get id(): string {
    return this.props.id;
  }

  get slug(): string {
    return this.props.slug;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get type(): CollectionType {
    return this.props.type;
  }

  get status(): CollectionStatus {
    return this.props.status;
  }

  get matchType(): CollectionRuleMatchType {
    return this.props.matchType;
  }

  get rules(): CollectionRule[] {
    return this.props.rules;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): CollectionProps {
    return { ...this.props };
  }
}
