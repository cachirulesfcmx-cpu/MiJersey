export interface PageBlockProps {
  id: string;
  pageId: string;
  type: string;
  position: number;
  config: Record<string, unknown>;
  createdAt: Date;
}

export class PageBlockEntity {
  constructor(private readonly props: PageBlockProps) {}

  get type(): string {
    return this.props.type;
  }

  get position(): number {
    return this.props.position;
  }

  get config(): Record<string, unknown> {
    return this.props.config;
  }

  toJSON(): PageBlockProps {
    return { ...this.props };
  }
}
