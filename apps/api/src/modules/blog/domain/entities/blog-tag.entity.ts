export interface BlogTagProps {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export class BlogTagEntity {
  constructor(private readonly props: BlogTagProps) {}

  get id(): string {
    return this.props.id;
  }

  get slug(): string {
    return this.props.slug;
  }

  toJSON(): BlogTagProps {
    return { ...this.props };
  }
}
