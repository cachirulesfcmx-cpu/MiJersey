export interface BlogCategoryProps {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export class BlogCategoryEntity {
  constructor(private readonly props: BlogCategoryProps) {}

  get id(): string {
    return this.props.id;
  }

  get slug(): string {
    return this.props.slug;
  }

  toJSON(): BlogCategoryProps {
    return { ...this.props };
  }
}
