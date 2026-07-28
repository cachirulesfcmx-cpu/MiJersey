export interface RedirectProps {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  createdAt: Date;
}

export class RedirectEntity {
  constructor(private readonly props: RedirectProps) {}

  get id(): string {
    return this.props.id;
  }

  get fromPath(): string {
    return this.props.fromPath;
  }

  get toPath(): string {
    return this.props.toPath;
  }

  get statusCode(): number {
    return this.props.statusCode;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): RedirectProps {
    return { ...this.props };
  }
}
