export interface AssetTagProps {
  id: string;
  name: string;
  slug: string;
}

export class AssetTagEntity {
  constructor(private readonly props: AssetTagProps) {}

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  toJSON(): AssetTagProps {
    return { ...this.props };
  }
}
