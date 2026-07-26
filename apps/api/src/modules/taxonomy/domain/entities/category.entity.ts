import type { CategoryStatus } from '../value-objects/taxonomy-enums';

export interface CategoryProps {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class CategoryEntity {
  constructor(private readonly props: CategoryProps) {}

  get id(): string {
    return this.props.id;
  }

  get parentId(): string | null {
    return this.props.parentId;
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

  get image(): string | null {
    return this.props.image;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get status(): CategoryStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): CategoryProps {
    return { ...this.props };
  }
}
