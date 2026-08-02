import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../../redis/redis.service';
import { PUBLIC_THEME_CACHE_KEY } from '../../theme.constants';

/** Caché del tema publicado — sin TTL, invalidada/repoblada solo por `PublishThemeUseCase` (spec §8 "invalidación selectiva"); ver `theme.constants.ts` para el razonamiento completo. */
@Injectable()
export class ThemeCacheService {
  constructor(private readonly redis: RedisService) {}

  async getPublished(): Promise<string | null> {
    return this.redis.client.get(PUBLIC_THEME_CACHE_KEY);
  }

  async setPublished(json: string): Promise<void> {
    await this.redis.client.set(PUBLIC_THEME_CACHE_KEY, json);
  }
}
