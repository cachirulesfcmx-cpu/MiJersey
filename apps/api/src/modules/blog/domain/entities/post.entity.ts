import type { PostStatus } from '../value-objects/post-enums';

export interface PostAuthorRef {
  id: string;
  firstName: string;
  lastName: string;
}

export interface PostTermRef {
  id: string;
  name: string;
  slug: string;
}

export interface PostProps {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featuredImage: string | null;
  status: PostStatus;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  author: PostAuthorRef;
  categories: PostTermRef[];
  tags: PostTermRef[];
  createdAt: Date;
  updatedAt: Date;
}

export class PostEntity {
  constructor(private readonly props: PostProps) {}

  get id(): string {
    return this.props.id;
  }

  get slug(): string {
    return this.props.slug;
  }

  get status(): PostStatus {
    return this.props.status;
  }

  get publishedAt(): Date | null {
    return this.props.publishedAt;
  }

  get categories(): PostTermRef[] {
    return this.props.categories;
  }

  get tags(): PostTermRef[] {
    return this.props.tags;
  }

  toJSON(): PostProps {
    return { ...this.props };
  }
}
