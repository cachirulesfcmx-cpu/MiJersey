import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { RedirectEntity } from '../../domain/entities/redirect.entity';
import {
  RedirectFromPathAlreadyExistsError,
  RedirectLoopError,
} from '../../domain/errors/seo.errors';
import type { RedirectRepositoryPort } from '../../domain/ports/redirect.repository.port';
import { REDIRECT_REPOSITORY } from '../../seo.constants';

const DEFAULT_STATUS_CODE = 301;

function normalizePath(path: string): string {
  const trimmed = path.trim();
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export interface CreateRedirectInput {
  fromPath: string;
  toPath: string;
  statusCode?: number;
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class CreateRedirectUseCase {
  constructor(
    @Inject(REDIRECT_REPOSITORY) private readonly redirects: RedirectRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: CreateRedirectInput): Promise<RedirectEntity> {
    const fromPath = normalizePath(input.fromPath);
    const toPath = normalizePath(input.toPath);

    if (fromPath === toPath) {
      throw new RedirectLoopError();
    }

    if (await this.redirects.findByFromPath(fromPath)) {
      throw new RedirectFromPathAlreadyExistsError();
    }

    const redirect = await this.redirects.create({
      fromPath,
      toPath,
      statusCode: input.statusCode ?? DEFAULT_STATUS_CODE,
    });

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'seo.redirect.created',
      ipAddress: input.ipAddress,
      metadata: { redirectId: redirect.id, fromPath, toPath },
    });

    return redirect;
  }
}
