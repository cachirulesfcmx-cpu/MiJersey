export interface AuditLogEntry {
  userId: string | null;
  action: string;
  ipAddress: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuditLogRepositoryPort {
  record(entry: AuditLogEntry): Promise<void>;
}
