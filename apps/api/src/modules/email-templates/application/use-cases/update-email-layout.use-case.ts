import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { EmailLayoutEntity } from '../../domain/entities/email-layout.entity';
import {
  EmailLayoutNotFoundError,
  InvalidEmailTemplateError,
} from '../../domain/errors/email-template.errors';
import type {
  EmailLayoutRepositoryPort,
  UpsertEmailLayoutData,
} from '../../domain/ports/email-layout.repository.port';
import { EMAIL_LAYOUT_REPOSITORY } from '../../email-templates.constants';

export interface UpdateEmailLayoutInput extends Partial<UpsertEmailLayoutData> {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateEmailLayoutUseCase {
  constructor(
    @Inject(EMAIL_LAYOUT_REPOSITORY) private readonly layouts: EmailLayoutRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateEmailLayoutInput): Promise<EmailLayoutEntity> {
    const existing = await this.layouts.findById(input.id);
    if (!existing) throw new EmailLayoutNotFoundError();

    if (input.html !== undefined && !input.html.includes('{{content}}')) {
      throw new InvalidEmailTemplateError('html debe incluir el placeholder {{content}}');
    }

    const { id, actorUserId, ipAddress, ...data } = input;
    const updated = await this.layouts.update(id, data);

    await this.auditLog.record({
      userId: actorUserId,
      action: 'email_layout.updated',
      ipAddress,
      metadata: { layoutId: id, updatedFields: Object.keys(data) },
    });

    return updated;
  }
}
