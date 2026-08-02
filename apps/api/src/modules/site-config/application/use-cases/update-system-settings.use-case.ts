import { Inject, Injectable } from '@nestjs/common';

import type { AuditLogRepositoryPort } from '../../../identity/domain/ports/audit-log.repository.port';
import { AUDIT_LOG_REPOSITORY } from '../../../identity/identity.constants';
import type { SystemSettingEntity } from '../../domain/entities/system-setting.entity';
import { InvalidSystemSettingError } from '../../domain/errors/site-config.errors';
import type {
  SystemSettingRepositoryPort,
  UpsertSystemSettingData,
} from '../../domain/ports/system-setting.repository.port';
import { SYSTEM_SETTING_REPOSITORY } from '../../site-config.constants';

export interface UpdateSystemSettingsInput {
  settings: UpsertSystemSettingData[];
  actorUserId: string;
  ipAddress: string | null;
}

@Injectable()
export class UpdateSystemSettingsUseCase {
  constructor(
    @Inject(SYSTEM_SETTING_REPOSITORY) private readonly repository: SystemSettingRepositoryPort,
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditLog: AuditLogRepositoryPort,
  ) {}

  async execute(input: UpdateSystemSettingsInput): Promise<SystemSettingEntity[]> {
    for (const setting of input.settings) {
      if (setting.key.trim().length === 0)
        throw new InvalidSystemSettingError('key es obligatorio');
      if (setting.category.trim().length === 0) {
        throw new InvalidSystemSettingError('category es obligatorio');
      }
    }

    const updated = await this.repository.upsertMany(input.settings);

    await this.auditLog.record({
      userId: input.actorUserId,
      action: 'site_config.system_settings_updated',
      ipAddress: input.ipAddress,
      metadata: { keys: input.settings.map((setting) => setting.key) },
    });

    return updated;
  }
}
