import { Inject, Injectable } from '@nestjs/common';

import type { SystemSettingEntity } from '../../domain/entities/system-setting.entity';
import type { SystemSettingRepositoryPort } from '../../domain/ports/system-setting.repository.port';
import { SYSTEM_SETTING_REPOSITORY } from '../../site-config.constants';

@Injectable()
export class ListSystemSettingsUseCase {
  constructor(
    @Inject(SYSTEM_SETTING_REPOSITORY) private readonly repository: SystemSettingRepositoryPort,
  ) {}

  async execute(category?: string): Promise<SystemSettingEntity[]> {
    return this.repository.findMany(category);
  }
}
