import type { PageStatus } from '../value-objects/page-enums';
import type { PageBlockEntity } from './page-block.entity';

export interface PageProps {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  template: string;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  blocks: PageBlockEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export class PageEntity {
  constructor(private readonly props: PageProps) {}

  get id(): string {
    return this.props.id;
  }

  get slug(): string {
    return this.props.slug;
  }

  get status(): PageStatus {
    return this.props.status;
  }

  get publishedAt(): Date | null {
    return this.props.publishedAt;
  }

  get blocks(): PageBlockEntity[] {
    return this.props.blocks;
  }

  toJSON(): Omit<PageProps, 'blocks'> & { blocks: ReturnType<PageBlockEntity['toJSON']>[] } {
    return {
      ...this.props,
      blocks: [...this.props.blocks]
        .sort((a, b) => a.position - b.position)
        .map((block) => block.toJSON()),
    };
  }
}
