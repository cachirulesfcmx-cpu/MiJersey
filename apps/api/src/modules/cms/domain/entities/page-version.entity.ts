import type { PageStatus } from '../value-objects/page-enums';

export interface PageSnapshotBlock {
  type: string;
  position: number;
  config: Record<string, unknown>;
}

export interface PageSnapshot {
  title: string;
  slug: string;
  status: PageStatus;
  template: string;
  seoTitle: string | null;
  seoDescription: string | null;
  blocks: PageSnapshotBlock[];
}

export interface PageVersionProps {
  id: string;
  pageId: string;
  versionNumber: number;
  snapshot: PageSnapshot;
  createdAt: Date;
}

export class PageVersionEntity {
  constructor(private readonly props: PageVersionProps) {}

  get versionNumber(): number {
    return this.props.versionNumber;
  }

  get snapshot(): PageSnapshot {
    return this.props.snapshot;
  }

  toJSON(): PageVersionProps {
    return { ...this.props };
  }
}
