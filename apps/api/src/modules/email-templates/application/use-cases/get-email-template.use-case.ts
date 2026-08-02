import { Inject, Injectable } from '@nestjs/common';

import type { EmailTemplateEntity } from '../../domain/entities/email-template.entity';
import { EmailTemplateNotFoundError } from '../../domain/errors/email-template.errors';
import type { EmailTemplateRepositoryPort } from '../../domain/ports/email-template.repository.port';
import { EMAIL_TEMPLATE_REPOSITORY } from '../../email-templates.constants';

@Injectable()
export class GetEmailTemplateUseCase {
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY) private readonly templates: EmailTemplateRepositoryPort,
  ) {}

  async execute(id: string): Promise<EmailTemplateEntity> {
    const template = await this.templates.findById(id);
    if (!template) throw new EmailTemplateNotFoundError();
    return template;
  }
}
