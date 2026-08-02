import type { EmailTemplateStatus } from '../value-objects/email-template-enums';

/** Snapshot completo (mismo criterio que `PageSnapshot`/`PostSnapshot`/`NavigationSnapshot`/`ThemeSnapshot`) — todo lo necesario para reconstruir la plantilla tal cual estaba en ese momento. */
export interface EmailTemplateSnapshot {
  name: string;
  key: string;
  language: string;
  subject: string;
  html: string;
  text: string;
  status: EmailTemplateStatus;
  layoutId: string | null;
}

export interface EmailTemplateVersionProps {
  id: string;
  templateId: string;
  versionNumber: number;
  snapshot: EmailTemplateSnapshot;
  createdAt: Date;
}

export class EmailTemplateVersionEntity {
  constructor(private readonly props: EmailTemplateVersionProps) {}

  get versionNumber(): number {
    return this.props.versionNumber;
  }

  get snapshot(): EmailTemplateSnapshot {
    return this.props.snapshot;
  }

  toJSON(): EmailTemplateVersionProps {
    return { ...this.props };
  }
}
