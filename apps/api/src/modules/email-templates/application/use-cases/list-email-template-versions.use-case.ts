import type { PaginatedResult, PaginationParams } from '@mijersey/shared-types';
import { Inject, Injectable } from '@nestjs/common';

import type { EmailTemplateVersionEntity } from '../../domain/entities/email-template-version.entity';
import { EmailTemplateNotFoundError } from '../../domain/errors/email-template.errors';
import type { EmailTemplateRepositoryPort } from '../../domain/ports/email-template.repository.port';
import type { EmailTemplateVersionRepositoryPort } from '../../domain/ports/email-template-version.repository.port';
import {
  EMAIL_TEMPLATE_REPOSITORY,
  EMAIL_TEMPLATE_VERSION_REPOSITORY,
} from '../../email-templates.constants';

export interface ListEmailTemplateVersionsInput extends PaginationParams {
  templateId: string;
}

@Injectable()
export class ListEmailTemplateVersionsUseCase {
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY) private readonly templates: EmailTemplateRepositoryPort,
    @Inject(EMAIL_TEMPLATE_VERSION_REPOSITORY)
    private readonly versions: EmailTemplateVersionRepositoryPort,
  ) {}

  async execute(
    input: ListEmailTemplateVersionsInput,
  ): Promise<PaginatedResult<EmailTemplateVersionEntity>> {
    const template = await this.templates.findById(input.templateId);
    if (!template) throw new EmailTemplateNotFoundError();

    return this.versions.findMany(input.templateId, {
      page: input.page,
      pageSize: input.pageSize,
    });
  }
}
