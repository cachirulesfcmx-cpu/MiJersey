export type EmailTemplateStatus = 'DRAFT' | 'PUBLISHED';

export interface EmailTemplate {
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
  createdAt: string;
  updatedAt: string;
}

export interface EmailLayout {
  id: string;
  name: string;
  html: string;
  css: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplateVersionSnapshot {
  name: string;
  key: string;
  language: string;
  subject: string;
  html: string;
  text: string;
  status: EmailTemplateStatus;
  layoutId: string | null;
}

export interface EmailTemplateVersion {
  id: string;
  templateId: string;
  versionNumber: number;
  snapshot: EmailTemplateVersionSnapshot;
  createdAt: string;
}

export interface CreateEmailTemplateInput {
  name: string;
  key: string;
  language: string;
  subject: string;
  html: string;
  text: string;
  layoutId?: string;
}

export interface UpdateEmailTemplateInput {
  name?: string;
  subject?: string;
  html?: string;
  text?: string;
  layoutId?: string | null;
}

export interface ListEmailTemplatesParams {
  page?: number;
  pageSize?: number;
  key?: string;
  language?: string;
  status?: EmailTemplateStatus;
}

export interface TestSendEmailTemplateInput {
  to: string;
  variables?: Record<string, string>;
}

export interface TestSendEmailTemplateResult {
  subject: string;
  html: string;
  text: string;
  missingVariables: string[];
}

export interface CreateEmailLayoutInput {
  name: string;
  html: string;
  css?: string;
}

export interface UpdateEmailLayoutInput {
  name?: string;
  html?: string;
  css?: string;
}
