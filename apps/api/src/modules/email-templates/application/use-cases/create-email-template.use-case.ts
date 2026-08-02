import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { EmailTemplateEntity } from '../../domain/entities/email-template.entity';
import { DuplicateEmailTemplateKeyError } from '../../domain/errors/email-template.errors';
import type {
  CreateEmailTemplateData,
  EmailTemplateRepositoryPort,
} from '../../domain/ports/email-template.repository.port';
import type { EmailTemplateVersionRepositoryPort } from '../../domain/ports/email-template-version.repository.port';
import { toEmailTemplateSnapshot } from '../../domain/value-objects/email-template-snapshot.util';
import {
  EMAIL_TEMPLATE_REPOSITORY,
  EMAIL_TEMPLATE_VERSION_REPOSITORY,
} from '../../email-templates.constants';

export interface CreateEmailTemplateInput extends CreateEmailTemplateData {
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateEmailTemplateUseCase {
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY) private readonly templates: EmailTemplateRepositoryPort,
    @Inject(EMAIL_TEMPLATE_VERSION_REPOSITORY)
    private readonly versions: EmailTemplateVersionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateEmailTemplateInput): Promise<EmailTemplateEntity> {
    const existing = await this.templates.findByKeyAndLanguage(input.key, input.language);
    if (existing) throw new DuplicateEmailTemplateKeyError();

    const { actorUserId, ipAddress, ...data } = input;
    const template = await this.templates.create(data);

    await this.versions.create(template.id, toEmailTemplateSnapshot(template));

    await this.auditLog.record({
      userId: actorUserId,
      action: 'email_template.created',
      ipAddress,
      metadata: { templateId: template.id, key: template.key, language: template.language },
    });

    return template;
  }
}
