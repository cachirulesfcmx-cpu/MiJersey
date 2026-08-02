import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { EmailTemplateEntity } from '../../domain/entities/email-template.entity';
import {
  EmailTemplateNotFoundError,
  InvalidEmailTemplateError,
} from '../../domain/errors/email-template.errors';
import type { EmailLayoutRepositoryPort } from '../../domain/ports/email-layout.repository.port';
import type { EmailTemplateRepositoryPort } from '../../domain/ports/email-template.repository.port';
import type { EmailTemplateVersionRepositoryPort } from '../../domain/ports/email-template-version.repository.port';
import { EmailTemplateStatus } from '../../domain/value-objects/email-template-enums';
import { toEmailTemplateSnapshot } from '../../domain/value-objects/email-template-snapshot.util';
import { validateEmailTemplateForPublish } from '../../domain/value-objects/email-template-validation';
import {
  EMAIL_LAYOUT_REPOSITORY,
  EMAIL_TEMPLATE_REPOSITORY,
  EMAIL_TEMPLATE_VERSION_REPOSITORY,
} from '../../email-templates.constants';
import { EmailTemplateCacheService } from '../services/email-template-cache.service';

export interface PublishEmailTemplateInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

/** `POST /admin/email/templates/:id/publish` — valida la sintaxis de variables (spec §4 "validar variables antes de publicar"), cambia el estado a `PUBLISHED`, reseedea la caché con la plantilla resuelta (+ su layout, si tiene) y deja una versión adicional marcando el momento exacto de publicación, mismo criterio que `PublishThemeUseCase` (029). */
@Injectable()
export class PublishEmailTemplateUseCase {
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY) private readonly templates: EmailTemplateRepositoryPort,
    @Inject(EMAIL_TEMPLATE_VERSION_REPOSITORY)
    private readonly versions: EmailTemplateVersionRepositoryPort,
    @Inject(EMAIL_LAYOUT_REPOSITORY) private readonly layouts: EmailLayoutRepositoryPort,
    private readonly cache: EmailTemplateCacheService,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: PublishEmailTemplateInput): Promise<EmailTemplateEntity> {
    const existing = await this.templates.findById(input.id);
    if (!existing) throw new EmailTemplateNotFoundError();

    const json = existing.toJSON();
    const error = validateEmailTemplateForPublish({
      subject: json.subject,
      html: json.html,
      text: json.text,
    });
    if (error) throw new InvalidEmailTemplateError(error);

    const published = await this.templates.updateStatus(input.id, EmailTemplateStatus.PUBLISHED);
    const layout = published.toJSON().layoutId
      ? await this.layouts.findById(published.toJSON().layoutId as string)
      : null;

    await this.cache.set(
      published.key,
      published.language,
      JSON.stringify({ template: published.toJSON(), layout: layout?.toJSON() ?? null }),
    );

    await this.versions.create(input.id, toEmailTemplateSnapshot(published));

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'email_template.published',
      ipAddress: input.ipAddress,
      metadata: { templateId: input.id, key: published.key, language: published.language },
    });

    return published;
  }
}
