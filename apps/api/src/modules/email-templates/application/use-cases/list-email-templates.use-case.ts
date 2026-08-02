import type { PaginatedResult } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type { EmailTemplateEntity } from '../../domain/entities/email-template.entity';
import type {
  EmailTemplateRepositoryPort,
  ListEmailTemplatesParams,
} from '../../domain/ports/email-template.repository.port';
import { EMAIL_TEMPLATE_REPOSITORY } from '../../email-templates.constants';

@Injectable()
export class ListEmailTemplatesUseCase {
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY) private readonly templates: EmailTemplateRepositoryPort,
  ) {}

  async execute(params: ListEmailTemplatesParams): Promise<PaginatedResult<EmailTemplateEntity>> {
    return this.templates.findMany(params);
  }
}
