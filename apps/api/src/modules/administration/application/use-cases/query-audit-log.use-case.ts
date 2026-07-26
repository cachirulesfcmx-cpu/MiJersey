import { Inject, Injectable } from '@nestjs/common';

import { AUDIT_LOG_QUERY_REPOSITORY } from '../../administration.constants';
import type {
  AuditLogQueryPort,
  AuditLogQueryResult,
} from '../../domain/ports/audit-log-query.port';

export interface QueryAuditLogInput {
  action?: string;
  userId?: string;
  fromDate?: Date;
  toDate?: Date;
  page: number;
  pageSize: number;
}

@Injectable()
export class QueryAuditLogUseCase {
  constructor(@Inject(AUDIT_LOG_QUERY_REPOSITORY) private readonly auditLog: AuditLogQueryPort) {}

  execute(input: QueryAuditLogInput): Promise<AuditLogQueryResult> {
    return this.auditLog.query({
      filter: {
        ...(input.action ? { action: input.action } : {}),
        ...(input.userId ? { userId: input.userId } : {}),
        ...(input.fromDate ? { fromDate: input.fromDate } : {}),
        ...(input.toDate ? { toDate: input.toDate } : {}),
      },
      page: input.page,
      pageSize: input.pageSize,
    });
  }
}
