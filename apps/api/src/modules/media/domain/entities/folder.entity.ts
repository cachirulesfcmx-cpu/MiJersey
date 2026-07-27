export interface FolderProps {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  createdAt: Date;
}

export class FolderEntity {
  constructor(private readonly props: FolderProps) {}

  get id(): string {
    return this.props.id;
  }

  get parentId(): string | null {
    return this.props.parentId;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): FolderProps {
    return { ...this.props };
  }
}
