import { Inject, Injectable } from '@nestjs/common';

import { AUDIT_LOG_QUERY_REPOSITORY, RECENT_ACTIVITY_LIMIT } from '../../administration.constants';
import type { AuditLogQueryPort, AuditLogRecord } from '../../domain/ports/audit-log-query.port';

@Injectable()
export class GetRecentActivityUseCase {
  constructor(@Inject(AUDIT_LOG_QUERY_REPOSITORY) private readonly auditLog: AuditLogQueryPort) {}

  execute(): Promise<AuditLogRecord[]> {
    return this.auditLog.listRecent(RECENT_ACTIVITY_LIMIT);
  }
}
