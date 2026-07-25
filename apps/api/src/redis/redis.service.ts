import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

import { APP_CONFIG } from '../config/env.config';
import type { AppConfig } from '../config/env.schema';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  readonly client: Redis;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.client = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  onModuleDestroy(): void {
    this.client.disconnect();
  }

  ping(): Promise<string> {
    return this.client.ping();
  }
}
