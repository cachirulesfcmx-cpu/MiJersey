import { Inject, Injectable } from '@nestjs/common';

import { APP_CONFIG } from '../../../../config/env.config';
import type { AppConfig } from '../../../../config/env.schema';

@Injectable()
export class GetRobotsTxtUseCase {
  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  execute(): string {
    const baseUrl = this.config.publicWebUrl.replace(/\/$/, '');
    return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
  }
}
