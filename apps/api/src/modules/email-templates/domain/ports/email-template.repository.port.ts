import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { EmailTemplateEntity } from '../entities/email-template.entity';
import type { EmailTemplateStatus } from '../value-objects/email-template-enums';

export interface CreateEmailTemplateData {
  name: string;
  key: string;
  language: string;
  subject: string;
  html: string;
  text: string;
  layoutId?: string | null;
}

export interface UpdateEmailTemplateData {
  name?: string;
  subject?: string;
  html?: string;
  text?: string;
  layoutId?: string | null;
}

export interface ListEmailTemplatesParams extends PaginationParams {
  key?: string;
  language?: string;
  status?: EmailTemplateStatus;
}

export interface EmailTemplateRepositoryPort {
  findById(id: string): Promise<EmailTemplateEntity | null>;
  findByKeyAndLanguage(key: string, language: string): Promise<EmailTemplateEntity | null>;
  findMany(params: ListEmailTemplatesParams): Promise<PaginatedResult<EmailTemplateEntity>>;
  create(data: CreateEmailTemplateData): Promise<EmailTemplateEntity>;
  update(id: string, data: UpdateEmailTemplateData): Promise<EmailTemplateEntity>;
  updateStatus(id: string, status: EmailTemplateStatus): Promise<EmailTemplateEntity>;
  delete(id: string): Promise<void>;
}
