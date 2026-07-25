import { Injectable } from '@nestjs/common';
import type { HealthIndicatorResult } from '@nestjs/terminus';
import { HealthCheckError, HealthIndicator } from '@nestjs/terminus';

import { RedisService } from '../redis/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.redis.ping();
      return this.getStatus(key, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown redis error';
      throw new HealthCheckError('Redis check failed', this.getStatus(key, false, { message }));
    }
  }
}
