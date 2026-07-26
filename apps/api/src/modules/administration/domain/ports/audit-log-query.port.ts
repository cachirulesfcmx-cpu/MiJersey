export interface AuditLogRecord {
  id: string;
  userId: string | null;
  action: string;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface AuditLogQueryFilter {
  action?: string;
  userId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface AuditLogQueryParams {
  filter?: AuditLogQueryFilter;
  page: number;
  pageSize: number;
}

export interface AuditLogQueryResult {
  items: AuditLogRecord[];
  total: number;
}

export interface AuditLogQueryPort {
  query(params: AuditLogQueryParams): Promise<AuditLogQueryResult>;
  listRecent(limit: number): Promise<AuditLogRecord[]>;
}
