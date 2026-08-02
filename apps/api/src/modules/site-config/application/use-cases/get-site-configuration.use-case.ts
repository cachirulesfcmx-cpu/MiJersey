import { Inject, Injectable } from '@nestjs/common';

import type { SiteConfigurationProps } from '../../domain/entities/site-configuration.entity';
import type { SiteConfigurationRepositoryPort } from '../../domain/ports/site-configuration.repository.port';
import { SITE_CONFIGURATION_REPOSITORY } from '../../site-config.constants';
import { SiteConfigCacheService } from '../services/site-config-cache.service';

@Injectable()
export class GetSiteConfigurationUseCase {
  constructor(
    @Inject(SITE_CONFIGURATION_REPOSITORY)
    private readonly repository: SiteConfigurationRepositoryPort,
    private readonly cache: SiteConfigCacheService,
  ) {}

  async execute(): Promise<SiteConfigurationProps> {
    const cached = await this.cache.get();
    if (cached) return JSON.parse(cached) as SiteConfigurationProps;

    const config = await this.repository.getConfiguration();
    const view = config.toJSON();
    await this.cache.set(JSON.stringify(view));
    return view;
  }
}
