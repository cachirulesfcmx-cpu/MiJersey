import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { EmailTemplateNotFoundError } from '../../domain/errors/email-template.errors';
import type { EmailTemplateRepositoryPort } from '../../domain/ports/email-template.repository.port';
import { EMAIL_TEMPLATE_REPOSITORY } from '../../email-templates.constants';
import { EmailTemplateCacheService } from '../services/email-template-cache.service';

export interface DeleteEmailTemplateInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteEmailTemplateUseCase {
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY) private readonly templates: EmailTemplateRepositoryPort,
    private readonly cache: EmailTemplateCacheService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteEmailTemplateInput): Promise<void> {
    const existing = await this.templates.findById(input.id);
    if (!existing) throw new EmailTemplateNotFoundError();

    await this.templates.delete(input.id);
    await this.cache.invalidate(existing.key, existing.language);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'email_template.deleted',
      ipAddress: input.ipAddress,
      metadata: { templateId: input.id, key: existing.key, language: existing.language },
    });
  }
}
