import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { EmailLayoutEntity } from '../../domain/entities/email-layout.entity';
import { InvalidEmailTemplateError } from '../../domain/errors/email-template.errors';
import type {
  EmailLayoutRepositoryPort,
  UpsertEmailLayoutData,
} from '../../domain/ports/email-layout.repository.port';
import { EMAIL_LAYOUT_REPOSITORY } from '../../email-templates.constants';

export interface CreateEmailLayoutInput extends UpsertEmailLayoutData {
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateEmailLayoutUseCase {
  constructor(
    @Inject(EMAIL_LAYOUT_REPOSITORY) private readonly layouts: EmailLayoutRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateEmailLayoutInput): Promise<EmailLayoutEntity> {
    if (!input.html.includes('{{content}}')) {
      throw new InvalidEmailTemplateError('html debe incluir el placeholder {{content}}');
    }

    const { actorUserId, ipAddress, ...data } = input;
    const layout = await this.layouts.create(data);

    await this.auditLog.record({
      userId: actorUserId,
      action: 'email_layout.created',
      ipAddress,
      metadata: { layoutId: layout.id, name: data.name },
    });

    return layout;
  }
}
