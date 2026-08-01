export type PageStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';

export interface PageBlock {
  id: string;
  pageId: string;
  type: string;
  position: number;
  config: Record<string, unknown>;
  createdAt: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  template: string;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  blocks: PageBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface PageVersion {
  id: string;
  pageId: string;
  versionNumber: number;
  snapshot: {
    title: string;
    slug: string;
    status: PageStatus;
    template: string;
    seoTitle: string | null;
    seoDescription: string | null;
    blocks: Array<{ type: string; position: number; config: Record<string, unknown> }>;
  };
  createdAt: string;
}

export interface PageBlockInput {
  type: string;
  position: number;
  config: Record<string, unknown>;
}

export interface CreatePageInput {
  title: string;
  slug: string;
  template?: string;
  seoTitle?: string;
  seoDescription?: string;
  blocks?: PageBlockInput[];
}

export interface UpdatePageInput {
  title?: string;
  slug?: string;
  template?: string;
  seoTitle?: string;
  seoDescription?: string;
  blocks?: PageBlockInput[];
}

export interface PublishPageInput {
  publishAt?: string;
}

export interface ListPagesParams {
  page?: number;
  pageSize?: number;
  status?: PageStatus;
}
