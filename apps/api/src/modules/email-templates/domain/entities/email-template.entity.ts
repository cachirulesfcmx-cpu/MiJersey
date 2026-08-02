import type { EmailTemplateStatus } from '../value-objects/email-template-enums';

export interface EmailTemplateProps {
  id: string;
  name: string;
  key: string;
  language: string;
  subject: string;
  html: string;
  text: string;
  status: EmailTemplateStatus;
  version: number;
  layoutId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class EmailTemplateEntity {
  constructor(private readonly props: EmailTemplateProps) {}

  get id(): string {
    return this.props.id;
  }

  get key(): string {
    return this.props.key;
  }

  get language(): string {
    return this.props.language;
  }

  get status(): EmailTemplateStatus {
    return this.props.status;
  }

  get version(): number {
    return this.props.version;
  }

  toJSON(): EmailTemplateProps {
    return { ...this.props };
  }
}
