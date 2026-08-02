import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { EmailLayoutNotFoundError } from '../../domain/errors/email-template.errors';
import type { EmailLayoutRepositoryPort } from '../../domain/ports/email-layout.repository.port';
import { EMAIL_LAYOUT_REPOSITORY } from '../../email-templates.constants';

export interface DeleteEmailLayoutInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteEmailLayoutUseCase {
  constructor(
    @Inject(EMAIL_LAYOUT_REPOSITORY) private readonly layouts: EmailLayoutRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteEmailLayoutInput): Promise<void> {
    const existing = await this.layouts.findById(input.id);
    if (!existing) throw new EmailLayoutNotFoundError();

    await this.layouts.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'email_layout.deleted',
      ipAddress: input.ipAddress,
      metadata: { layoutId: input.id },
    });
  }
}
