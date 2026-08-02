export interface EmailLayoutProps {
  id: string;
  name: string;
  html: string;
  css: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class EmailLayoutEntity {
  constructor(private readonly props: EmailLayoutProps) {}

  get id(): string {
    return this.props.id;
  }

  get html(): string {
    return this.props.html;
  }

  get css(): string | null {
    return this.props.css;
  }

  toJSON(): EmailLayoutProps {
    return { ...this.props };
  }
}
