export interface SystemSettingProps {
  id: string;
  key: string;
  value: unknown;
  category: string;
  updatedAt: Date;
}

export class SystemSettingEntity {
  constructor(private readonly props: SystemSettingProps) {}

  get key(): string {
    return this.props.key;
  }

  get category(): string {
    return this.props.category;
  }

  toJSON(): SystemSettingProps {
    return { ...this.props };
  }
}
