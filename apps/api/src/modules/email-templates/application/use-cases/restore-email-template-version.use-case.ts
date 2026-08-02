import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { EmailTemplateEntity } from '../../domain/entities/email-template.entity';
import {
  EmailTemplateNotFoundError,
  EmailTemplateVersionNotFoundError,
} from '../../domain/errors/email-template.errors';
import type { EmailTemplateRepositoryPort } from '../../domain/ports/email-template.repository.port';
import type { EmailTemplateVersionRepositoryPort } from '../../domain/ports/email-template-version.repository.port';
import { toEmailTemplateSnapshot } from '../../domain/value-objects/email-template-snapshot.util';
import {
  EMAIL_TEMPLATE_REPOSITORY,
  EMAIL_TEMPLATE_VERSION_REPOSITORY,
} from '../../email-templates.constants';

export interface RestoreEmailTemplateVersionInput {
  templateId: string;
  versionNumber: number;
  actorUserId: string;
  ipAddress: string | null;
}

/** Restaurar aplica el snapshot al borrador y crea una versión nueva, pero nunca toca la caché pública ni el `status` vigente — mismo criterio que Page/Post/NavigationMenu/Theme: una restauración exige una publicación explícita para llegar a los envíos reales. */
@Injectable()
export class RestoreEmailTemplateVersionUseCase {
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY) private readonly templates: EmailTemplateRepositoryPort,
    @Inject(EMAIL_TEMPLATE_VERSION_REPOSITORY)
    private readonly versions: EmailTemplateVersionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: RestoreEmailTemplateVersionInput): Promise<EmailTemplateEntity> {
    const existing = await this.templates.findById(input.templateId);
    if (!existing) throw new EmailTemplateNotFoundError();

    const version = await this.versions.findByTemplateAndNumber(
      input.templateId,
      input.versionNumber,
    );
    if (!version) throw new EmailTemplateVersionNotFoundError();

    const { snapshot } = version;
    const restored = await this.templates.update(input.templateId, {
      name: snapshot.name,
      subject: snapshot.subject,
      html: snapshot.html,
      text: snapshot.text,
      layoutId: snapshot.layoutId,
    });

    await this.versions.create(input.templateId, toEmailTemplateSnapshot(restored));

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'email_template.version_restored',
      ipAddress: input.ipAddress,
      metadata: { templateId: input.templateId, restoredFrom: input.versionNumber },
    });

    return restored;
  }
}
