import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';

import type { EmailTemplateSnapshot } from '../entities/email-template-version.entity';
import type { EmailTemplateVersionEntity } from '../entities/email-template-version.entity';

export interface EmailTemplateVersionRepositoryPort {
  findByTemplateAndNumber(
    templateId: string,
    versionNumber: number,
  ): Promise<EmailTemplateVersionEntity | null>;
  findMany(
    templateId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<EmailTemplateVersionEntity>>;
  getNextVersionNumber(templateId: string): Promise<number>;
  create(templateId: string, snapshot: EmailTemplateSnapshot): Promise<EmailTemplateVersionEntity>;
}
