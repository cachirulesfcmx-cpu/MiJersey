import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../../redis/redis.service';
import { publishedTemplateCacheKey } from '../../email-templates.constants';

/** Caché de plantillas publicadas (spec §8) — sin TTL, mismo criterio que `ThemeCacheService` (029) y `SiteConfigCacheService` (030): el único escritor de cada clave es `PublishEmailTemplateUseCase`. */
@Injectable()
export class EmailTemplateCacheService {
  constructor(private readonly redis: RedisService) {}

  async get(key: string, language: string): Promise<string | null> {
    return this.redis.client.get(publishedTemplateCacheKey(key, language));
  }

  async set(key: string, language: string, json: string): Promise<void> {
    await this.redis.client.set(publishedTemplateCacheKey(key, language), json);
  }

  async invalidate(key: string, language: string): Promise<void> {
    await this.redis.client.del(publishedTemplateCacheKey(key, language));
  }
}
