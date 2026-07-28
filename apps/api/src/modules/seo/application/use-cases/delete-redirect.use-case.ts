import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import { RedirectNotFoundError } from '../../domain/errors/seo.errors';
import type { RedirectRepositoryPort } from '../../domain/ports/redirect.repository.port';
import { REDIRECT_REPOSITORY } from '../../seo.constants';

export interface DeleteRedirectInput {
  id: string;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class DeleteRedirectUseCase {
  constructor(
    @Inject(REDIRECT_REPOSITORY) private readonly redirects: RedirectRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: DeleteRedirectInput): Promise<void> {
    const redirect = await this.redirects.findById(input.id);
    if (!redirect) {
      throw new RedirectNotFoundError();
    }

    await this.redirects.delete(input.id);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'seo.redirect.deleted',
      ipAddress: input.ipAddress,
      metadata: { redirectId: input.id, fromPath: redirect.fromPath },
    });
  }
}
