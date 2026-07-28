import type { BrandStatus } from '../value-objects/brand-status';

export interface BrandProps {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  logoMediaId: string | null;
  coverMediaId: string | null;
  website: string | null;
  country: string | null;
  status: BrandStatus;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export class BrandEntity {
  constructor(private readonly props: BrandProps) {}

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

  get shortDescription(): string | null {
    return this.props.shortDescription;
  }

  get logoMediaId(): string | null {
    return this.props.logoMediaId;
  }

  get coverMediaId(): string | null {
    return this.props.coverMediaId;
  }

  get website(): string | null {
    return this.props.website;
  }

  get country(): string | null {
    return this.props.country;
  }

  get status(): BrandStatus {
    return this.props.status;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): BrandProps {
    return { ...this.props };
  }
}
