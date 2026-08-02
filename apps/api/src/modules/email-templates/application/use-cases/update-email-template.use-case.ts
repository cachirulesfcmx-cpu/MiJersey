import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { EmailTemplateEntity } from '../../domain/entities/email-template.entity';
import { EmailTemplateNotFoundError } from '../../domain/errors/email-template.errors';
import type {
  EmailTemplateRepositoryPort,
  UpdateEmailTemplateData,
} from '../../domain/ports/email-template.repository.port';
import type { EmailTemplateVersionRepositoryPort } from '../../domain/ports/email-template-version.repository.port';
import { toEmailTemplateSnapshot } from '../../domain/value-objects/email-template-snapshot.util';
import {
  EMAIL_TEMPLATE_REPOSITORY,
  EMAIL_TEMPLATE_VERSION_REPOSITORY,
} from '../../email-templates.constants';

export interface UpdateEmailTemplateInput extends UpdateEmailTemplateData {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

/** Cada `PATCH` crea una versión nueva (mismo criterio que Page/Post/NavigationMenu/Theme) — el campo `version` de la entidad avanza automáticamente al persistir (`PrismaEmailTemplateRepository.update`), y aquí se registra el snapshot correspondiente en `EmailTemplateVersion`. */
@Injectable()
export class UpdateEmailTemplateUseCase {
  constructor(
    @Inject(EMAIL_TEMPLATE_REPOSITORY) private readonly templates: EmailTemplateRepositoryPort,
    @Inject(EMAIL_TEMPLATE_VERSION_REPOSITORY)
    private readonly versions: EmailTemplateVersionRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateEmailTemplateInput): Promise<EmailTemplateEntity> {
    const existing = await this.templates.findById(input.id);
    if (!existing) throw new EmailTemplateNotFoundError();

    const { id, actorUserId, ipAddress, ...data } = input;
    const updated = await this.templates.update(id, data);

    await this.versions.create(id, toEmailTemplateSnapshot(updated));

    await this.auditLog.record({
      userId: actorUserId,
      action: 'email_template.updated',
      ipAddress,
      metadata: { templateId: id, updatedFields: Object.keys(data) },
    });

    return updated;
  }
}
