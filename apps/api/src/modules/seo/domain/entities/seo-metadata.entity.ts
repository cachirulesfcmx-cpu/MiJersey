import type {
  SeoEntityType,
  SeoRobotsDirective,
  SeoTwitterCardType,
} from '../value-objects/seo-enums';

export interface SeoMetadataProps {
  id: string;
  entityType: SeoEntityType;
  entityId: string;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  robots: SeoRobotsDirective;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageMediaId: string | null;
  twitterCard: SeoTwitterCardType;
  structuredData: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SeoMetadataEntity {
  constructor(private readonly props: SeoMetadataProps) {}

  get id(): string {
    return this.props.id;
  }

  get entityType(): SeoEntityType {
    return this.props.entityType;
  }

  get entityId(): string {
    return this.props.entityId;
  }

  get metaTitle(): string | null {
    return this.props.metaTitle;
  }

  get metaDescription(): string | null {
    return this.props.metaDescription;
  }

  get metaKeywords(): string | null {
    return this.props.metaKeywords;
  }

  get canonicalUrl(): string | null {
    return this.props.canonicalUrl;
  }

  get robots(): SeoRobotsDirective {
    return this.props.robots;
  }

  get ogTitle(): string | null {
    return this.props.ogTitle;
  }

  get ogDescription(): string | null {
    return this.props.ogDescription;
  }

  get ogImageMediaId(): string | null {
    return this.props.ogImageMediaId;
  }

  get twitterCard(): SeoTwitterCardType {
    return this.props.twitterCard;
  }

  get structuredData(): Record<string, unknown> | null {
    return this.props.structuredData;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): SeoMetadataProps {
    return { ...this.props };
  }
}
