import type { EmailLayoutEntity } from '../entities/email-layout.entity';

export interface UpsertEmailLayoutData {
  name: string;
  html: string;
  css?: string | null;
}

export interface EmailLayoutRepositoryPort {
  findById(id: string): Promise<EmailLayoutEntity | null>;
  findMany(): Promise<EmailLayoutEntity[]>;
  create(data: UpsertEmailLayoutData): Promise<EmailLayoutEntity>;
  update(id: string, data: Partial<UpsertEmailLayoutData>): Promise<EmailLayoutEntity>;
  delete(id: string): Promise<void>;
}
