import type { SystemSettingEntity } from '../entities/system-setting.entity';

export interface UpsertSystemSettingData {
  key: string;
  value: unknown;
  category: string;
}

export interface SystemSettingRepositoryPort {
  findMany(category?: string): Promise<SystemSettingEntity[]>;
  upsertMany(entries: UpsertSystemSettingData[]): Promise<SystemSettingEntity[]>;
}
