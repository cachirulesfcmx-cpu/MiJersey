import type { HomeSectionConfiguration } from '../value-objects/home-section-config';
import type { HomeSectionStatus, HomeSectionType } from '../value-objects/home-section-enums';

export interface HomeSectionProps {
  id: string;
  type: HomeSectionType;
  title: string;
  configuration: HomeSectionConfiguration;
  sortOrder: number;
  status: HomeSectionStatus;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class HomeSectionEntity {
  constructor(private readonly props: HomeSectionProps) {}

  get id(): string {
    return this.props.id;
  }

  get type(): HomeSectionType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get configuration(): HomeSectionConfiguration {
    return this.props.configuration;
  }

  get status(): HomeSectionStatus {
    return this.props.status;
  }

  get isVisible(): boolean {
    return this.props.isVisible;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  toJSON(): HomeSectionProps {
    return { ...this.props };
  }
}
